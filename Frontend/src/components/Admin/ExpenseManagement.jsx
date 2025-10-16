import React, { useEffect, useState } from 'react';
import { DollarSign, Eye, Filter, FileText, FileSpreadsheet, TrendingUp, Calendar } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const AdminExpenseManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchExpenses();
  }, [statusFilter]);

  useEffect(() => {
    filterExpenses();
  }, [expenses, searchTerm]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const status = statusFilter === 'all' ? '' : statusFilter;
      const response = await api.get(
        `/expenses/admin/all-expense-requests${status ? `?status=${status}` : ''}`
      );
      setExpenses(response.data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const filterExpenses = () => {
    if (!searchTerm) {
      setFilteredExpenses(expenses);
      return;
    }
    const filtered = expenses.filter(exp =>
      exp.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.employee_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.request_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredExpenses(filtered);
  };

  const getStatusColor = (status) => {
    if (!status) return 'secondary';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('approved')) return 'default';
    if (statusLower.includes('rejected')) return 'destructive';
    if (statusLower.includes('pending')) return 'outline';
    return 'secondary';
  };

  const downloadPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFontSize(18);
    doc.text('Expense Management Report (Admin)', 14, 20);
    
    const tableData = filteredExpenses.map(exp => [
      exp.employee_name,
      exp.request_code,
      exp.category,
      `${exp.amount} ${exp.currency}`,
      new Date(exp.expense_date).toLocaleDateString(),
      exp.status,
      exp.description?.substring(0, 50) || 'N/A'
    ]);

    doc.autoTable({
      head: [['Employee', 'Request Code', 'Category', 'Amount', 'Date', 'Status', 'Description']],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`expenses_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF downloaded successfully');
  };

  const downloadExcel = () => {
    const excelData = filteredExpenses.map(exp => ({
      'Request Code': exp.request_code,
      'Employee Name': exp.employee_name,
      'Email': exp.employee_email,
      'Role': exp.role || 'N/A',
      'Employment Type': exp.employment_type || 'N/A',
      'Category': exp.category,
      'Amount': exp.amount,
      'Currency': exp.currency,
      'Expense Date': new Date(exp.expense_date).toLocaleDateString(),
      'Status': exp.status,
      'Tax Included': exp.tax_included ? 'Yes' : 'No',
      'Discount %': exp.discount_percentage || 0,
      'CGST %': exp.cgst_percentage || 0,
      'SGST %': exp.sgst_percentage || 0,
      'Final Amount': exp.final_amount || 0,
      'Description': exp.description || 'N/A',
      'Created At': exp.created_at ? new Date(exp.created_at).toLocaleDateString() : 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
    XLSX.writeFile(wb, `expenses_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel downloaded successfully');
  };

  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const pendingCount = expenses.filter(e => e.status?.toLowerCase().includes('pending')).length;
  const approvedCount = expenses.filter(e => e.status?.toLowerCase() === 'approved').length;
  const rejectedCount = expenses.filter(e => e.status?.toLowerCase().includes('rejected')).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Expense Management (Admin View)</h1>
                <p className="text-sm text-gray-600">View-only access to all employee expenses</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={downloadPDF}
                disabled={loading || filteredExpenses.length === 0}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Download PDF
              </Button>
              <Button
                onClick={downloadExcel}
                disabled={loading || filteredExpenses.length === 0}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Download Excel
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Total Expenses</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{expenses.length}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Total Amount</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">${totalAmount.toFixed(2)}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-900">Pending</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">Approved</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-red-900">Rejected</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="all">All</option>
              <option value="pending_manager_approval">Pending Manager</option>
              <option value="pending_hr_approval">Pending HR</option>
              <option value="pending_account_mgr_approval">Pending Account Manager</option>
              <option value="approved">Approved</option>
              <option value="manager_rejected">Manager Rejected</option>
              <option value="hr_rejected">HR Rejected</option>
            </select>
            <Input
              placeholder="Search by employee name, email, category, or request code"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request Code</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">No expenses found</TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((item) => (
                    <TableRow key={item.request_id}>
                      <TableCell>{item.request_code}</TableCell>
                      <TableCell>{item.employee_name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.amount} {item.currency}</TableCell>
                      <TableCell>{new Date(item.expense_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.description?.substring(0, 50) || 'N/A'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminExpenseManagement;
