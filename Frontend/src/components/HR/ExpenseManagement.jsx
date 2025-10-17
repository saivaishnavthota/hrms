
import React, { useEffect, useMemo, useState } from 'react';
import {
  Eye,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Check,
  X,
  FileText,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useUser } from '@/contexts/UserContext';
import HRExpenseForm from './HRExpenseForm';
import NewExpenseForm from '../Manager/NewExpenseForm'; 
import { toast } from 'react-toastify';
import api from '@/lib/api';
import { PaginationControls, usePagination } from '@/components/ui/pagination-controls';
import PageSizeSelect from '@/components/ui/page-size-select';

const ExpenseManagement = ({ viewOnly = false }) => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('pending');
  const [expenses, setExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [isOwnExpenseOpen, setIsOwnExpenseOpen] = useState(false); // New state for HR's own expense form
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [myExpenses, setMyExpenses] = useState([]);
  const [myLoading, setMyLoading] = useState(false);
  const [myError, setMyError] = useState(null);

  // Pagination for pending expenses
  const {
    currentPage,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    getPaginatedData,
    getTotalPages,
    resetPagination
  } = usePagination(10);

  // Pagination for my expenses
  const myPagination = usePagination(10);

  // Filter states
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const token = useMemo(() => localStorage.getItem('authToken'), []);

  // Helper to get employeeId with localStorage fallback
  const getEmployeeId = () => {
    let employeeId = user?.employeeId;
    if (!employeeId) {
      const stored = localStorage.getItem('userData');
      if (stored) {
        const parsed = JSON.parse(stored);
        employeeId = parsed?.employeeId;
      }
    }
    return employeeId;
  };

  // Fallback implementation for avatarBg
  const getAvatarColor = (name) => {
    const colors = [ 'bg-[rgb(141,233,113)]', 'bg-[rgb(173,150,220)]', 'bg-black'];
    const index = name ? name.length % colors.length : 0;
    return colors[index];
  };

  const getInitials = (name) => {
    if (!name) return 'NA';
    const parts = name.trim().split(' ');
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    return (first + second).toUpperCase();
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString();
    } catch {
      return iso;
    }
  };

  const mapStatus = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending_hr_approval':
        return 'Pending';
      case 'approved':
      case 'pending_account_mgr_approval':
        return 'Approved';
      case 'hr_rejected':
        return 'Rejected';
      default:
        return status || 'Pending';
    }
  };

  const mapExpense = (item) => ({
    id: item.id,
    requestId: item.id,
    employee: {
      name: item.employeeName || 'Unknown',
      email: item.employeeEmail || '',
      avatar: getInitials(item.employeeName || 'U'),
    },
    category: item.category || 'N/A',
    amount: Number(item.amount || 0),
    currency: item.currency || 'INR',
    details: item.description || '',
    submittedOn: formatDate(item.submitted_at),
    status: mapStatus(item.status),
    attachments: item.attachments || [],
    discount_percentage: item.discount_percentage || 0,
    cgst_percentage: item.cgst_percentage || 0,
    sgst_percentage: item.sgst_percentage || 0,
    final_amount: item.final_amount || item.amount,
    taxIncluded: item.taxIncluded || false,
  });

  const mapMyExpense = (item) => ({
    id: item.request_id,
    category: item.category || 'N/A',
    date: formatDate(item.expense_date || item.submitted_at),
    amount: Number(item.amount || 0),
    currency: item.currency || 'INR',
    description: item.description || '',
    status: mapStatus(item.status),
    approvals: item.history?.map((h) => ({
      name: h.action_by_name,
      role: h.action_role,
      reason: h.reason || '-',
      status: mapStatus(h.action),
    })) || [],
  });

  const fetchPendingExpenses = async (year = selectedYear, month = selectedMonth) => {
    const employeeId = getEmployeeId();
    if (!employeeId) {
      setError('Missing HR ID in user context or local storage');
      toast.error('Missing HR ID. Please log in again.');
      return;
    }
    if (!token) {
      setError('Missing authentication token');
      toast.error('Missing authentication token');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/expenses/hr-exp-list', {
        params: { hr_id: employeeId, year, month },
        headers: { Authorization: `Bearer ${token}` },
      });
      const mapped = (response.data || []).map(mapExpense);
      setExpenses(mapped.filter((e) => e.status.toLowerCase() === 'pending'));
      setError(null);
    } catch (err) {
      console.error('Error fetching pending expenses:', err);
      setError('Failed to fetch pending requests');
      toast.error(err.response?.data?.detail || 'Failed to fetch pending requests');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllExpenses = async (year = selectedYear, month = selectedMonth) => {
    const employeeId = getEmployeeId();
    if (!employeeId) {
      setError('Missing HR ID in user context or local storage');
      toast.error('Missing HR ID. Please log in again.');
      return;
    }
    if (!token) {
      setError('Missing authentication token');
      toast.error('Missing authentication token');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/expenses/hr-exp-list', {
        params: { hr_id: employeeId, year, month },
        headers: { Authorization: `Bearer ${token}` },
      });
      const mapped = (response.data || []).map(mapExpense);
      setExpenses(mapped);
      setError(null);
    } catch (err) {
      console.error('Error fetching all expenses:', err);
      setError('Failed to fetch expense list');
      toast.error(err.response?.data?.detail || 'Failed to fetch expense list');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyExpenses = async (year = selectedYear, month = selectedMonth) => {
    const employeeId = getEmployeeId();
    if (!employeeId) {
      setError('Missing employee ID in user context or local storage');
      toast.error('Missing employee ID. Please log in again.');
      return;
    }
    if (!token) {
      setError('Missing authentication token');
      toast.error('Missing authentication token');
      return;
    }

    setMyLoading(true);
    try {
      const response = await api.get('/expenses/my-expenses', {
        params: { employee_id: employeeId, year, month },
        headers: { Authorization: `Bearer ${token}` },
      });
      const mapped = (response.data || []).map(mapMyExpense);
      setMyExpenses(mapped);
      setMyError(null);
    } catch (err) {
      console.error('Error fetching my expenses:', err);
      setMyError('Failed to fetch my expense history');
      toast.error(err.response?.data?.detail || 'Failed to fetch my expense history');
      setMyExpenses([]);
    } finally {
      setMyLoading(false);
    }
  };

  const handleFilterChange = () => {
    if (activeTab === 'pending') fetchPendingExpenses(selectedYear, selectedMonth);
    else if (activeTab === 'my') fetchMyExpenses(selectedYear, selectedMonth);
    else fetchAllExpenses(selectedYear, selectedMonth);
  };

  useEffect(() => {
    console.log('User:', user);
    console.log('Token:', token);
    if (activeTab === 'pending') fetchPendingExpenses(selectedYear, selectedMonth);
    else if (activeTab === 'my') fetchMyExpenses(selectedYear, selectedMonth);
    else fetchAllExpenses(selectedYear, selectedMonth);
  }, [activeTab, token, selectedYear, selectedMonth]);

  const handleViewDetails = (expense) => {
    setSelectedExpense(expense);
    setIsDetailsOpen(true);
  };

  const handleNewExpenseSuccess = () => {
    setIsNewExpenseOpen(false);
    setIsOwnExpenseOpen(false); // Close HR's own expense form
    if (activeTab === 'pending') fetchPendingExpenses();
    else if (activeTab === 'all') fetchAllExpenses();
    else if (activeTab === 'my') fetchMyExpenses();
  };

  const handleApprove = async (expense) => {
    const employeeId = getEmployeeId();
    if (!employeeId) {
      toast.error('Missing HR ID. Please log in again.');
      return;
    }
    try {
      const { isConfirmed, value } = await Swal.fire({
        title: 'Approve Expense',
        input: 'textarea',
        inputLabel: 'Reason (optional)',
        inputPlaceholder: 'Enter approval reason...',
        showCancelButton: true,
        confirmButtonText: 'Submit',
      });
      if (!isConfirmed) return;

      const formData = new FormData();
      formData.append('hr_id', employeeId);
      formData.append('status', 'Approved');
      formData.append('reason', (value || '-').trim() || '-');

      await api.put(`/expenses/hr-upd-status/${expense.requestId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Expense approved');
      setExpenses((prev) =>
        activeTab === 'pending'
          ? prev.filter((e) => e.requestId !== expense.requestId)
          : prev.map((e) =>
              e.requestId === expense.requestId ? { ...e, status: 'Approved' } : e
            )
      );
    } catch (err) {
      console.error('Approve failed:', err);
      toast.error(err.response?.data?.detail || 'Failed to approve expense');
    }
  };

  const handleReject = async (expense) => {
    const employeeId = getEmployeeId();
    if (!employeeId) {
      toast.error('Missing HR ID. Please log in again.');
      return;
    }
    try {
      const { isConfirmed, value } = await Swal.fire({
        title: 'Reject Expense',
        input: 'textarea',
        inputLabel: 'Reason (optional)',
        inputPlaceholder: 'Enter rejection reason...',
        showCancelButton: true,
        confirmButtonText: 'Submit',
      });
      if (!isConfirmed) return;

      const formData = new FormData();
      formData.append('hr_id', employeeId);
      formData.append('status', 'Rejected');
      formData.append('reason', (value || '-').trim() || '-');

      await api.put(`/expenses/hr-upd-status/${expense.requestId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Expense rejected');
      setExpenses((prev) =>
        activeTab === 'pending'
          ? prev.filter((e) => e.requestId !== expense.requestId)
          : prev.map((e) =>
              e.requestId === expense.requestId ? { ...e, status: 'Rejected' } : e
            )
      );
    } catch (err) {
      console.error('Reject failed:', err);
      toast.error(err.response?.data?.detail || 'Failed to reject expense');
    }
  };

  const filteredExpenses = expenses.filter((expense) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (expense.employee.name || '').toLowerCase().includes(q) ||
      (expense.employee.email || '').toLowerCase().includes(q) ||
      (expense.category || '').toLowerCase().includes(q) ||
      (expense.details || '').toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === 'all' ||
      (expense.status || '').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Reset pagination when filters change
  useEffect(() => {
    resetPagination();
  }, [searchTerm, statusFilter, activeTab]);

  useEffect(() => {
    myPagination.resetPagination();
  }, [activeTab]);

  // Apply pagination
  const paginatedExpenses = getPaginatedData(filteredExpenses);
  const totalPages = getTotalPages(filteredExpenses.length);

  const paginatedMyExpenses = myPagination.getPaginatedData(myExpenses);
  const myTotalPages = myPagination.getTotalPages(myExpenses.length);

  const getStatusBadge = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Download Expense Report as PDF
  const downloadExpenseAsPDF = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
      
      // Header
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('Expense Report', 14, 15);
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(`Period: ${getMonthName(selectedMonth)} ${selectedYear}`, 14, 23);
      doc.text(`Status Filter: ${statusFilter === 'all' ? 'All' : statusFilter}`, 14, 29);
      doc.text(`Total Expenses: ${filteredExpenses.length}`, 14, 35);
      
      // Calculate totals
      const totalAmount = filteredExpenses.reduce((sum, exp) => sum + (exp.final_amount || exp.amount), 0);
      doc.text(`Total Amount: ${filteredExpenses[0]?.currency || 'INR'} ${totalAmount.toFixed(2)}`, 14, 41);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 47);
      
      // Table data
      const tableData = filteredExpenses.map(expense => [
        expense.employee.name,
        expense.category,
        expense.details.substring(0, 30) + (expense.details.length > 30 ? '...' : ''),
        `${expense.currency} ${expense.amount.toFixed(2)}`,
        `${expense.discount_percentage || 0}%`,
        `${(expense.cgst_percentage || 0) + (expense.sgst_percentage || 0)}%`,
        `${expense.currency} ${(expense.final_amount || expense.amount).toFixed(2)}`,
        expense.submittedOn,
        expense.status
      ]);
      
      doc.autoTable({
        startY: 53,
        head: [['Employee', 'Category', 'Description', 'Amount', 'Discount', 'Tax', 'Final Amount', 'Date', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: {
          fontSize: 7,
          cellPadding: 2,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 25 },
          2: { cellWidth: 40 },
          3: { cellWidth: 25 },
          4: { cellWidth: 18 },
          5: { cellWidth: 15 },
          6: { cellWidth: 28 },
          7: { cellWidth: 22 },
          8: { cellWidth: 20 }
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        },
        margin: { left: 14, right: 14 }
      });
      
      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 10);
      }
      
      doc.save(`Expense_Report_${selectedMonth}_${selectedYear}.pdf`);
      toast.success('PDF report downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF report.');
    }
  };

  // Download Expense Report as Excel
  const downloadExpenseAsExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = filteredExpenses.map(expense => ({
        'Employee Name': expense.employee.name,
        'Employee Email': expense.employee.email,
        'Category': expense.category,
        'Description': expense.details,
        'Amount': expense.amount,
        'Currency': expense.currency,
        'Discount (%)': expense.discount_percentage || 0,
        'CGST (%)': expense.cgst_percentage || 0,
        'SGST (%)': expense.sgst_percentage || 0,
        'Total Tax (%)': (expense.cgst_percentage || 0) + (expense.sgst_percentage || 0),
        'Final Amount': expense.final_amount || expense.amount,
        'Tax Included': expense.taxIncluded ? 'Yes' : 'No',
        'Submitted Date': expense.submittedOn,
        'Status': expense.status,
        'Attachments': expense.attachments.length > 0 ? expense.attachments.join(', ') : 'None'
      }));
      
      // Calculate summary
      const totalAmount = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const totalFinalAmount = filteredExpenses.reduce((sum, exp) => sum + (exp.final_amount || exp.amount), 0);
      const avgDiscount = filteredExpenses.length > 0 
        ? filteredExpenses.reduce((sum, exp) => sum + (exp.discount_percentage || 0), 0) / filteredExpenses.length 
        : 0;
      
      const summaryData = [
        { 'Summary': 'Period', 'Value': `${getMonthName(selectedMonth)} ${selectedYear}` },
        { 'Summary': 'Total Expenses', 'Value': filteredExpenses.length },
        { 'Summary': 'Total Amount (before discount/tax)', 'Value': totalAmount.toFixed(2) },
        { 'Summary': 'Total Final Amount', 'Value': totalFinalAmount.toFixed(2) },
        { 'Summary': 'Average Discount %', 'Value': avgDiscount.toFixed(2) },
        { 'Summary': 'Pending', 'Value': filteredExpenses.filter(e => e.status.toLowerCase() === 'pending').length },
        { 'Summary': 'Approved', 'Value': filteredExpenses.filter(e => e.status.toLowerCase() === 'approved').length },
        { 'Summary': 'Rejected', 'Value': filteredExpenses.filter(e => e.status.toLowerCase() === 'rejected').length },
        { 'Summary': 'Generated Date', 'Value': new Date().toLocaleDateString() }
      ];
      
      // Create workbook with multiple sheets
      const wb = XLSX.utils.book_new();
      
      // Add summary sheet
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
      
      // Add expense data sheet
      const wsData = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths
      const colWidths = [
        { wch: 25 }, // Employee Name
        { wch: 30 }, // Employee Email
        { wch: 20 }, // Category
        { wch: 50 }, // Description
        { wch: 12 }, // Amount
        { wch: 10 }, // Currency
        { wch: 12 }, // Discount
        { wch: 10 }, // CGST
        { wch: 10 }, // SGST
        { wch: 12 }, // Total Tax
        { wch: 15 }, // Final Amount
        { wch: 12 }, // Tax Included
        { wch: 15 }, // Submitted Date
        { wch: 12 }, // Status
        { wch: 40 }  // Attachments
      ];
      wsData['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, wsData, 'Expense Data');
      
      // Write file
      XLSX.writeFile(wb, `Expense_Report_${selectedMonth}_${selectedYear}.xlsx`);
      toast.success('Excel report downloaded successfully!');
    } catch (error) {
      console.error('Excel generation error:', error);
      toast.error('Failed to generate Excel report.');
    }
  };

  // Helper function to get month name
  const getMonthName = (monthNum) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[parseInt(monthNum) - 1] || 'Unknown';
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Expense Management
            {viewOnly && <span className="ml-3 text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">View Only</span>}
          </h1>
          <p className="text-gray-600 mt-1">
            {viewOnly ? 'View all expense claims (read-only access)' : 'Review and approve team expense claims'}
          </p>
        </div>
        {!viewOnly && (
          <div className="flex gap-2">
            {/* <Button
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => setIsNewExpenseOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Expense for Employee
            </Button> */}
            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => setIsOwnExpenseOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add My Expense
            </Button>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={downloadExpenseAsPDF}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-sm"
            disabled={filteredExpenses.length === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            Download PDF
          </button>
          <button
            onClick={downloadExpenseAsExcel}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm"
            disabled={filteredExpenses.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Download Excel
          </button>
        </div>
        {/* Removed old per-page selector; using PageSizeSelect above each table */}
      </div>
      <div className="mb-2">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending Requests
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Expense Request
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Expenses
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'my' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <PageSizeSelect
            pageSize={myPagination.pageSize}
            onPageSizeChange={myPagination.handlePageSizeChange}
          />
          {myLoading ? (
            <div className="px-6 py-10 text-center text-gray-600">Loading expenses...</div>
          ) : myError ? (
            <div className="px-6 py-4 text-red-700 bg-red-50 border border-red-200">{myError}</div>
          ) : myExpenses.length === 0 ? (
            <div className="px-6 py-4 text-gray-600">No expenses found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="w-12 text-center font-semibold text-gray-700 px-6 py-4">S.NO</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">Expense Category</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">Date</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">Details</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">Status</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMyExpenses.map((item, index) => (
                  <TableRow key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <TableCell className="text-center text-gray-600 px-6 py-4">{(myPagination.currentPage - 1) * myPagination.pageSize + index + 1}</TableCell>
                    <TableCell className="px-6 py-4 text-gray-700">{item.category}</TableCell>
                    <TableCell className="px-6 py-4 text-gray-700">{item.date}</TableCell>
                    <TableCell className="px-6 py-4 text-gray-700">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-3 text-xs bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl p-0">
                          <div className="w-full bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-xl shadow-2xl max-h-[100vh] overflow-y-auto border border-gray-200">
                            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-gray-600 to-blue-600 rounded-t-xl">
                              <h3 className="text-lg font-semibold text-white">
                                Submitted Expense Details
                              </h3>
                            </div>
                            <div className="space-y-4 p-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div className="rounded-lg p-4 bg-white">
                                  <div className="text-gray-500">Category</div>
                                  <div className="font-medium text-gray-800">{item.category}</div>
                                </div>
                                <div className="rounded-lg p-4 bg-white">
                                  <div className="text-gray-500">Date</div>
                                  <div className="font-medium text-gray-800">{item.date}</div>
                                </div>
                                <div className="rounded-lg p-4 bg-white">
                                  <div className="text-gray-500">Amount</div>
                                  <div className="font-medium text-gray-800">
                                    {item.final_amount} {item.currency}
                                  </div>
                                </div>
                                <div className="rounded-lg p-4 bg-white">
                                  <div className="text-gray-500">Description</div>
                                  <div className="font-medium text-gray-800">{item.description}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span
                        className={`${
                          item.status === 'Approved'
                            ? 'text-green-700 bg-green-50 border border-green-200'
                            : item.status === 'Rejected'
                            ? 'text-red-700 bg-red-50 border border-red-200'
                            : 'text-yellow-700 bg-yellow-50 border border-yellow-200'
                        } px-2 py-1 rounded-md text-xs`}
                      >
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-800 hover:text-blue-800"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl p-0">
                          <div className="w-full bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-xl shadow-2xl max-h-[100vh] overflow-y-auto border border-gray-200">
                            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-gray-600 to-blue-600 rounded-t-xl">
                              <h3 className="text-lg font-semibold text-white">
                                Manager & HR Details
                              </h3>
                            </div>
                            <div className="space-y-4 p-6">
                              {(item.approvals || []).map((appr, idx) => (
                                <div
                                  key={idx}
                                  className="rounded-lg border border-gray-200 bg-white shadow-sm p-4 space-y-2"
                                >
                                  <div className="flex justify-between">
                                    <p className="font-medium text-gray-700">Name</p>
                                    <p className="text-gray-900">{appr.name}</p>
                                  </div>
                                  <div className="flex justify-between">
                                    <p className="font-medium text-gray-700">Role</p>
                                    <p className="text-gray-900">{appr.role}</p>
                                  </div>
                                  <div className="flex justify-between">
                                    <p className="font-medium text-gray-700">Reason</p>
                                    <p className="text-gray-900">{appr.reason || '-'}</p>
                                  </div>
                                  <div className="flex justify-between">
                                    <p className="font-medium text-gray-700">Status</p>
                                    <span
                                      className={`${
                                        appr.status === 'Approved'
                                          ? 'text-green-700 bg-green-50 border border-green-200'
                                          : appr.status === 'Rejected'
                                          ? 'text-red-700 bg-red-50 border border-red-200'
                                          : 'text-yellow-700 bg-yellow-50 border border-yellow-200'
                                      } px-3 py-1 rounded-md text-xs font-medium`}
                                    >
                                      {appr.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {activeTab !== 'my' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Month:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = i + 1;
                    const monthName = new Date(2024, i).toLocaleString('default', { month: 'long' });
                    return (
                      <option key={month} value={month}>
                        {monthName}
                      </option>
                    );
                  })}
                </select>
              </div>
              <button
                onClick={handleFilterChange}
                className="px-4 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Apply Filters
              </button>
            </div>
          </div>
          {loading ? (
            <div className="px-6 py-10 text-center text-gray-600">Loading expenses...</div>
          ) : error ? (
            <div className="px-6 py-4 text-red-700 bg-red-50 border border-red-200">{error}</div>
          ) : filteredExpenses.length === 0 ? (
            <div className="px-6 py-4 text-gray-600">No expenses found.</div>
          ) : (
            <>
            <PageSizeSelect
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
            />
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="w-12 text-center font-semibold text-gray-700 px-6 py-4">S.NO</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">EMPLOYEE</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">CATEGORY</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">AMOUNT</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">DETAILS</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">SUBMITTED ON</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">STATUS</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedExpenses.map((expense, index) => (
                  <TableRow key={expense.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <TableCell className="text-center text-gray-600 px-6 py-4">{(currentPage - 1) * pageSize + index + 1}</TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full ${getAvatarColor(
                            expense.employee.name
                          )} flex items-center justify-center text-white font-medium text-sm`}
                        >
                          {expense.employee.avatar}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{expense.employee.name}</div>
                          <div className="text-sm text-gray-500">
                            <span>{expense.employee.email}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-700">{expense.category}</TableCell>
                    <TableCell className="px-6 py-4 font-medium text-gray-900">
                      {new Intl.NumberFormat(undefined, { style: 'currency', currency: expense.currency || 'INR' }).format(
                        expense.final_amount
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-700">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-3 text-xs bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                        onClick={() => handleViewDetails(expense)}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-700">{expense.submittedOn}</TableCell>
                    <TableCell className="px-6 py-4">{getStatusBadge(expense.status)}</TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                          onClick={() => handleViewDetails(expense)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!viewOnly && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                              onClick={() => handleApprove(expense)}
                              disabled={expense.status !== 'Pending'}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                              onClick={() => handleReject(expense)}
                              disabled={expense.status !== 'Pending'}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {activeTab === 'my' ? (
        myExpenses.length > 0 && (
          <PaginationControls
            currentPage={myPagination.currentPage}
            totalPages={myTotalPages}
            pageSize={myPagination.pageSize}
            totalItems={myExpenses.length}
            onPageChange={myPagination.handlePageChange}
            onPageSizeChange={myPagination.handlePageSizeChange}
            align="right"
            hideInfo
            hidePageSize
          />
        )
      ) : (
        filteredExpenses.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredExpenses.length}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            align="right"
            hideInfo
            hidePageSize
          />
        )
      )}

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
            <DialogDescription>Complete information about the expense request</DialogDescription>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Request ID</label>
                  <p className="text-sm font-semibold text-gray-900">{selectedExpense.requestId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-sm text-gray-900">{selectedExpense.category}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Employee</label>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className={`w-8 h-8 rounded-full ${getAvatarColor(
                      selectedExpense.employee.name
                    )} flex items-center justify-center text-white font-medium text-xs`}
                  >
                    {selectedExpense.employee.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedExpense.employee.name}</p>
                    <p className="text-xs text-gray-500">{selectedExpense.employee.email}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Base Amount</label>
                  <p className="text-lg font-bold text-gray-900">
                    {new Intl.NumberFormat(undefined, { style: 'currency', currency: selectedExpense.currency || 'INR' }).format(
                      selectedExpense.amount
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedExpense.status)}</div>
                </div>
              </div>
              {selectedExpense.taxIncluded && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <h4 className="text-xs font-semibold text-blue-900 mb-2">Tax & Discount Breakdown</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {selectedExpense.discount_percentage > 0 && (
                      <div>
                        <span className="text-blue-700">Discount:</span>
                        <span className="font-semibold text-blue-900 ml-1">{selectedExpense.discount_percentage}%</span>
                      </div>
                    )}
                    {selectedExpense.cgst_percentage > 0 && (
                      <div>
                        <span className="text-blue-700">CGST:</span>
                        <span className="font-semibold text-blue-900 ml-1">{selectedExpense.cgst_percentage}%</span>
                      </div>
                    )}
                    {selectedExpense.sgst_percentage > 0 && (
                      <div>
                        <span className="text-blue-700">SGST:</span>
                        <span className="font-semibold text-blue-900 ml-1">{selectedExpense.sgst_percentage}%</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-300">
                    <span className="text-xs text-blue-700">Final Amount:</span>
                    <p className="text-lg font-bold text-blue-900">
                      {new Intl.NumberFormat(undefined, { style: 'currency', currency: selectedExpense.currency || 'INR' }).format(selectedExpense.final_amount)}
                    </p>
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Submitted On</label>
                <p className="text-sm text-gray-900">{selectedExpense.submittedOn}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Details</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md border">
                  {selectedExpense.details}
                </p>
              </div>
              {selectedExpense.attachments?.length ? (
                <div>
                  <label className="text-sm font-medium text-gray-500">Attachments</label>
                  <div className="mt-2 space-y-2">
                    {selectedExpense.attachments.map((att, idx) => (
                      <a
                        key={idx}
                        href={att.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 text-sm underline"
                      >
                        {att.file_name || `Attachment ${idx + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isNewExpenseOpen} onOpenChange={setIsNewExpenseOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Expense for Employee</DialogTitle>
            <DialogDescription>Add an expense on behalf of an employee</DialogDescription>
          </DialogHeader>
          <HRExpenseForm
            onSuccess={handleNewExpenseSuccess}
            onCancel={() => setIsNewExpenseOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isOwnExpenseOpen} onOpenChange={setIsOwnExpenseOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add My Expense</DialogTitle>
            <DialogDescription>Add an expense for yourself</DialogDescription>
          </DialogHeader>
          <NewExpenseForm
            onSuccess={handleNewExpenseSuccess}
            onCancel={() => setIsOwnExpenseOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseManagement;