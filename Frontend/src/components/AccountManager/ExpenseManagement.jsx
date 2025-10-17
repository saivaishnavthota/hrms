import React, { useEffect, useMemo, useState } from 'react';
import {
  Eye,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Check,
  X,
  FileText,
  Plus,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { avatarBg } from '../../lib/avatarColors';
import NewExpenseForm from '../Manager/NewExpenseForm';
import { PaginationControls, usePagination } from '@/components/ui/pagination-controls';
import PageSizeSelect from '@/components/ui/page-size-select';

// Formatter for INR currency
const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

const AccountManagerExpenseManagement = () => {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem('authToken'), []);
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [activeTab, setActiveTab] = useState('pending');
  const [expenses, setExpenses] = useState([]);
  const [myExpenses, setMyExpenses] = useState([]);
  const [myLoading, setMyLoading] = useState(false);
  const [myError, setMyError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState(String(year));
  const [selectedMonth, setSelectedMonth] = useState(String(month));

  const years = Array.from({ length: 6 }, (_, i) => String(year - i));
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const getAvatarColor = (name) => avatarBg(name);

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
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'pending':
      case 'pending_manager_approval':
        return 'Pending Manager Approval';
      case 'pending_hr_approval':
        return 'Pending HR Approval';
      case 'pending_account_mgr_approval':
      case 'pending_account_manager_approval':
        return 'Pending Account Manager Approval';
      case 'approved':
        return 'Approved';
      case 'mgr_rejected':
      case 'manager_rejected':
        return 'Manager Rejected';
      case 'hr_rejected':
        return 'HR Rejected';
      case 'acc_mgr_rejected':
      case 'account_manager_rejected':
        return 'Account Manager Rejected';
      case 'rejected':
        return 'Rejected';
      default:
        return status ? status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Pending';
    }
  };

  const mapExpense = (item) => {
    try {
      return {
        id: item.id || item.request_id,
        requestId: item.id || item.request_id,
        employee: {
          name: item.employeeName || item.employee_name || 'Unknown',
          email: item.employeeEmail || item.employee_email || '',
          avatar: getInitials(item.employeeName || item.employee_name || 'U'),
        },
        category: item.category || '',
        amount: Number(item.amount || 0),
        currency: item.currency || 'INR',
        details: item.description || '',
        submittedOn: formatDate(item.submitted_at || item.expense_date || item.date),
        status: mapStatus(item.status),
        attachments: item.attachment
          ? [{ file_name: 'Attachment', file_url: item.attachment }]
          : item.attachments
          ? typeof item.attachments === 'string'
            ? [{ file_name: 'Attachment', file_url: item.attachments }]
            : item.attachments.map((att) => ({
                file_name: att.file_name || 'Attachment',
                file_url: att.file_url,
              }))
          : [],
        discount_percentage: item.discount_percentage || 0,
        cgst_percentage: item.cgst_percentage || 0,
        sgst_percentage: item.sgst_percentage || 0,
        final_amount: item.final_amount || item.amount,
        taxIncluded: item.taxIncluded || false,
      };
    } catch (err) {
      console.error('Error mapping expense:', item, err);
      throw err;
    }
  };

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

  const fetchPendingExpenses = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      toast.error('Missing account manager ID. Please log in.');
      navigate('/login', { replace: true });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/expenses/acc-mgr-exp-list', {
        params: {
          acc_mgr_id: userId,
          year: Number(selectedYear),
          month: Number(selectedMonth),
        },
      });
      const data = Array.isArray(response.data) ? response.data : response.data?.results || [];
      const mapped = data.map(mapExpense);
      const filtered = mapped.filter((e) => {
        const status = e.status.toLowerCase();
        return status.includes('pending account manager');
      });
      setExpenses(filtered);
    } catch (err) {
      console.error('Error in fetchPendingExpenses:', err, err.response?.data);
      toast.error(`Failed to fetch pending requests: ${err.message}`);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyExpenses = async () => {
    const employeeId = localStorage.getItem('userId');
    if (!employeeId) {
      toast.error('Missing employee ID. Please log in.');
      navigate('/login', { replace: true });
      return;
    }
    setMyLoading(true);
    setMyError(null);
    try {
      const response = await api.get('/expenses/my-expenses', {
        params: { employee_id: employeeId, year: Number(selectedYear), month: Number(selectedMonth) },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = Array.isArray(response.data) ? response.data : response.data?.results || [];
      setMyExpenses(data.map(mapMyExpense));
    } catch (err) {
      console.error('Error fetching my expenses:', err, err.response?.data);
      toast.error(`Failed to fetch my expense history: ${err.message}`);
      setMyExpenses([]);
      setMyError('Failed to fetch my expense history');
    } finally {
      setMyLoading(false);
    }
  };

  const fetchAllExpenses = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      toast.error('Missing account manager ID. Please log in.');
      navigate('/login', { replace: true });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/expenses/acc-mgr-exp-list', {
        params: {
          acc_mgr_id: userId,
          year: Number(selectedYear),
          month: Number(selectedMonth),
        },
      });
      const data = Array.isArray(response.data) ? response.data : response.data?.results || [];
      const mapped = data.map(mapExpense);
      setExpenses(mapped);
    } catch (err) {
      console.error('Error in fetchAllExpenses:', err, err.response?.data);
      toast.error(`Failed to fetch expense list: ${err.message}`);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (expense) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      toast.error('Missing account manager ID. Please log in.');
      navigate('/login', { replace: true });
      return;
    }
    try {
      const { isConfirmed, value } = await Swal.fire({
        title: 'Approve Expense',
        input: 'textarea',
        inputLabel: 'Reason (optional)',
        inputPlaceholder: 'Enter approval reason...',
        inputAttributes: { 'aria-label': 'Enter approval reason' },
        showCancelButton: true,
        confirmButtonText: 'Submit',
      });
      if (!isConfirmed) return;
      const reason = (value || '-').trim() || '-';
      const accMgrId = parseInt(userId, 10);
      if (isNaN(accMgrId)) {
        throw new Error('Invalid account manager ID');
      }

      const form = new FormData();
      form.append('acc_mgr_id', accMgrId.toString());
      form.append('status', 'Approved');
      form.append('reason', reason);

      await api.put(`/expenses/acc-mgr-upd-status/${expense.requestId}`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setExpenses((prev) => prev.filter((e) => e.requestId !== expense.requestId));
      toast.success('Expense approved successfully!');
      
      if (activeTab === 'pending') fetchPendingExpenses();
      else if (activeTab === 'all') fetchAllExpenses();
    } catch (err) {
      console.error('Approve failed:', err, err.response?.data);
      toast.error(`Failed to approve expense: ${err.message}`);
    }
  };

  const handleReject = async (expense) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      toast.error('Missing account manager ID. Please log in.');
      navigate('/login', { replace: true });
      return;
    }
    try {
      const { isConfirmed, value } = await Swal.fire({
        title: 'Reject Expense',
        input: 'textarea',
        inputLabel: 'Reason (optional)',
        inputPlaceholder: 'Enter rejection reason...',
        inputAttributes: { 'aria-label': 'Enter rejection reason' },
        showCancelButton: true,
        confirmButtonText: 'Submit',
      });
      if (!isConfirmed) return;
      const reason = (value || '-').trim() || '-';
      const accMgrId = parseInt(userId, 10);
      if (isNaN(accMgrId)) {
        throw new Error('Invalid account manager ID');
      }

      const form = new FormData();
      form.append('acc_mgr_id', accMgrId.toString());
      form.append('status', 'Rejected');
      form.append('reason', reason);

      await api.put(`/expenses/acc-mgr-upd-status/${expense.requestId}`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setExpenses((prev) => prev.filter((e) => e.requestId !== expense.requestId));
      toast.success('Expense rejected successfully!');
      
      if (activeTab === 'pending') fetchPendingExpenses();
      else if (activeTab === 'all') fetchAllExpenses();
    } catch (err) {
      console.error('Reject failed:', err, err.response?.data);
      toast.error(`Failed to reject expense: ${err.message}`);
    }
  };

  const filteredExpenses = useMemo(() => {
    const filtered = expenses.filter((expense) => {
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
    return filtered;
  }, [expenses, searchTerm, statusFilter]);

  // Use pagination hook for filtered expenses
  const paginatedExpenses = getPaginatedData(filteredExpenses);

  // Reset pagination when filters change
  useEffect(() => {
    resetPagination();
  }, [filteredExpenses, searchTerm, statusFilter]);

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
          <Badge className="bg-red-100 text-red-700 hover:bg-green-100">
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

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('Missing account manager ID. Please log in.');
      navigate('/login', { replace: true });
      return;
    }
    setUserId(userId);
    if (activeTab === 'pending') fetchPendingExpenses();
    else if (activeTab === 'all') fetchAllExpenses();
    else if (activeTab === 'my') fetchMyExpenses();
  }, [activeTab, selectedYear, selectedMonth, navigate]);

  const handleViewDetails = (expense) => {
    setSelectedExpense(expense);
    setIsDetailsOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Expense Management</h1>
          <p className="text-gray-600 mt-1">Review and approve team expense claims</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsNewExpenseOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            aria-label="Add My Expense"
          >
            <Plus className="h-4 w-4" />
            Add My Expense
          </Button>
        </div>
      </div>

      <div className="mb-2">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" role="tablist">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              role="tab"
              aria-selected={activeTab === 'pending'}
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
              role="tab"
              aria-selected={activeTab === 'all'}
            >
              All Expense Requests
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              role="tab"
              aria-selected={activeTab === 'my'}
            >
              My Expense
            </button>
          </nav>
        </div>
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
              aria-label="Search expenses"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" aria-label="Filter by status">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40" aria-label="Filter by month">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32" aria-label="Filter by year">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            More Filters
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Per Page:</span>
            <Select value={perPage} onValueChange={setPerPage}>
              <SelectTrigger className="w-16 h-8" aria-label="Items per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {activeTab === 'my' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
                {myExpenses.map((item, index) => (
                  <TableRow key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <TableCell className="text-center text-gray-600 px-6 py-4">{index + 1}</TableCell>
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
                              <h3 className="text-lg font-semibold text-white">Submitted Expense Details</h3>
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
                                  <div className="font-medium text-gray-800">{item.amount} {item.currency}</div>
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
                          <Button variant="ghost" size="sm" className="text-blue-800 hover:text-blue-800">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl p-0">
                          <div className="w-full bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-xl shadow-2xl max-h-[100vh] overflow-y-auto border border-gray-200">
                            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-gray-600 to-blue-600 rounded-t-xl">
                              <h3 className="text-lg font-semibold text-white">Manager & HR Details</h3>
                            </div>
                            <div className="space-y-4 p-6">
                              {(item.approvals || []).map((appr, idx) => (
                                <div key={idx} className="rounded-lg border border-gray-200 bg-white shadow-sm p-4 space-y-2">
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
          {loading ? (
            <div className="px-6 py-10 text-center text-gray-600">Loading expenses...</div>
          ) : error ? (
            <div className="px-6 py-4 text-red-700 bg-red-50 border border-red-200">{error}</div>
          ) : paginatedExpenses.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-600">No expenses found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="w-12 text-center font-semibold text-gray-700 px-6 py-4">S.NO</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">Employee</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">Category</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">Amount</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">Submitted On</TableHead>
                  <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">Status</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700 px-6 py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedExpenses.map((expense, index) => (
                  <TableRow key={expense.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <TableCell className="text-center text-gray-600 px-6 py-4">
                      {(currentPage - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                          style={{ backgroundColor: getAvatarColor(expense.employee.name) }}
                        >
                          {expense.employee.avatar}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{expense.employee.name}</div>
                          <div className="text-xs text-gray-500">{expense.employee.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-700">{expense.category}</TableCell>
                    <TableCell className="px-6 py-4 text-gray-900 font-medium">
                      {formatINR(expense.amount)}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-700">{expense.submittedOn}</TableCell>
                    <TableCell className="px-6 py-4">{getStatusBadge(expense.status)}</TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(expense)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          aria-label="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {activeTab === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(expense)}
                              className="text-green-600 hover:text-green-800 hover:bg-green-50"
                              aria-label="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReject(expense)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              aria-label="Reject"
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
          )}
        </div>
      )}

      {activeTab !== 'my' && filteredExpenses.length > 0 && (
        <>
          <div className="flex justify-end mb-2">
            <PageSizeSelect
              pageSize={pageSize}
              onChange={handlePageSizeChange}
              options={[10, 20, 30, 40, 50]}
            />
          </div>
          <PaginationControls
            className="mt-3"
            align="right"
            hideInfo={true}
            hidePageSize={true}
            currentPage={currentPage}
            totalPages={getTotalPages(filteredExpenses.length)}
            pageSize={pageSize}
            totalItems={filteredExpenses.length}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl p-0">
          <div className="w-full bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-xl">
              <h3 className="text-xl font-semibold text-white">Expense Details</h3>
            </div>
            {selectedExpense && (
              <div className="space-y-6 p-6">
                <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-semibold"
                    style={{ backgroundColor: getAvatarColor(selectedExpense.employee.name) }}
                  >
                    {selectedExpense.employee.avatar}
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{selectedExpense.employee.name}</div>
                    <div className="text-sm text-gray-600">{selectedExpense.employee.email}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-lg p-4 bg-white shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500 mb-1">Category</div>
                    <div className="font-semibold text-gray-900">{selectedExpense.category}</div>
                  </div>
                  <div className="rounded-lg p-4 bg-white shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500 mb-1">Amount</div>
                    <div className="font-semibold text-gray-900 text-lg">
                      {formatINR(selectedExpense.amount)}
                    </div>
                  </div>
                  <div className="rounded-lg p-4 bg-white shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500 mb-1">Submitted On</div>
                    <div className="font-medium text-gray-900">{selectedExpense.submittedOn}</div>
                  </div>
                  <div className="rounded-lg p-4 bg-white shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500 mb-1">Status</div>
                    <div className="font-medium">{getStatusBadge(selectedExpense.status)}</div>
                  </div>
                </div>

                {selectedExpense.details && (
                  <div className="rounded-lg p-4 bg-white shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500 mb-2">Description</div>
                    <div className="text-gray-900 whitespace-pre-wrap">{selectedExpense.details}</div>
                  </div>
                )}

                {selectedExpense.attachments && selectedExpense.attachments.length > 0 && (
                  <div className="rounded-lg p-4 bg-white shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500 mb-3">Attachments</div>
                    <div className="space-y-2">
                      {selectedExpense.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          {att.file_name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedExpense.discount_percentage > 0 || selectedExpense.cgst_percentage > 0 || selectedExpense.sgst_percentage > 0) && (
                  <div className="rounded-lg p-4 bg-white shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500 mb-3">Tax Details</div>
                    <div className="space-y-2 text-sm">
                      {selectedExpense.discount_percentage > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Discount</span>
                          <span className="font-medium text-gray-900">{selectedExpense.discount_percentage}%</span>
                        </div>
                      )}
                      {selectedExpense.cgst_percentage > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">CGST</span>
                          <span className="font-medium text-gray-900">{selectedExpense.cgst_percentage}%</span>
                        </div>
                      )}
                      {selectedExpense.sgst_percentage > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">SGST</span>
                          <span className="font-medium text-gray-900">{selectedExpense.sgst_percentage}%</span>
                        </div>
                      )}
                      {selectedExpense.final_amount !== selectedExpense.amount && (
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="text-gray-900 font-semibold">Final Amount</span>
                          <span className="font-semibold text-gray-900 text-lg">
                            {formatINR(selectedExpense.final_amount)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => {
                        handleApprove(selectedExpense);
                        setIsDetailsOpen(false);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => {
                        handleReject(selectedExpense);
                        setIsDetailsOpen(false);
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewExpenseOpen} onOpenChange={setIsNewExpenseOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add My Expense</DialogTitle>
            <DialogDescription>Submit a personal expense for approval</DialogDescription>
          </DialogHeader>
          <NewExpenseForm
            onSuccess={() => {
              toast.success('Expense submitted successfully');
              setIsNewExpenseOpen(false);
              if (activeTab === 'pending') fetchPendingExpenses();
              else if (activeTab === 'all') fetchAllExpenses();
              else if (activeTab === 'my') fetchMyExpenses();
            }}
            onCancel={() => setIsNewExpenseOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountManagerExpenseManagement;