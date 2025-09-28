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
} from 'lucide-react';
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
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { avatarBg } from '../../lib/avatarColors';

const AccountManagerExpenseManagement = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(localStorage.getItem('userId')); // Fetch userId from localStorage
  const [activeTab, setActiveTab] = useState('pending');
  const [expenses, setExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [perPage, setPerPage] = useState('10');
  const [page, setPage] = useState(1);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Compute current year/month to satisfy backend validation
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
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'pending_account_mgr_approval':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'acc_mgr_rejected':
        return 'Rejected';
      default:
        return status || 'Pending';
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
        details: item.description || '',
        submittedOn: formatDate(item.submitted_at || item.expense_date || item.date),
        status: mapStatus(item.status),
        attachments: item.attachment
          ? [{ file_name: 'Attachment', file_path: item.attachment }]
          : item.attachments
          ? typeof item.attachments === 'string'
            ? [{ file_name: 'Attachment', file_path: item.attachments }]
            : item.attachments.map((att) => ({
                file_name: att.file_name || 'Attachment',
                file_path: att.file_path,
              }))
          : [],
      };
    } catch (err) {
      console.error('Error mapping expense:', item, err);
      throw err;
    }
  };

  const fetchPendingExpenses = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('Missing account manager ID. Please log in.');
      navigate('/login', { replace: true });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching pending expenses with params:', {
        acc_mgr_id: userId,
        year: Number(selectedYear),
        month: Number(selectedMonth),
      });
      const response = await api.get('/expenses/acc-mgr-exp-list', {
        params: {
          acc_mgr_id: userId,
          year: Number(selectedYear),
          month: Number(selectedMonth),
        },
      });
      console.log('Raw response:', response);
      const data = Array.isArray(response.data) ? response.data : response.data?.results || [];
      console.log('Parsed data:', data);
      const mapped = data.map(mapExpense);
      console.log('Mapped expenses:', mapped);
      setExpenses(mapped.filter((e) => e.status.toLowerCase() === 'pending'));
      console.log('Filtered pending expenses:', mapped.filter((e) => e.status.toLowerCase() === 'pending'));
    } catch (err) {
      console.error('Error in fetchPendingExpenses:', err, err.response?.data);
      setError(`Failed to fetch pending requests: ${err.message}`);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllExpenses = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('Missing account manager ID. Please log in.');
      navigate('/login', { replace: true });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching all expenses with params:', {
        acc_mgr_id: userId,
        year: Number(selectedYear),
        month: Number(selectedMonth),
      });
      const response = await api.get('/expenses/acc-mgr-exp-list', {
        params: {
          acc_mgr_id: userId,
          year: Number(selectedYear),
          month: Number(selectedMonth),
        },
      });
      console.log('Raw response:', response);
      const data = Array.isArray(response.data) ? response.data : response.data?.results || [];
      console.log('Parsed data:', data);
      const mapped = data.map(mapExpense);
      console.log('Mapped expenses:', mapped);

    setExpenses(mapped.filter((e) => 
      e.status.toLowerCase() === 'approved' || e.status.toLowerCase() === 'rejected'
    ));

    } catch (err) {
      console.error('Error in fetchAllExpenses:', err, err.response?.data);
      setError(`Failed to fetch expense list: ${err.message}`);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (expense) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('Missing account manager ID. Please log in.');
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
      
      // Log FormData contents
      console.log('FormData for approve:', {
        acc_mgr_id: form.get('acc_mgr_id'),
        status: form.get('status'),
        reason: form.get('reason'),
      });

      const response = await api.put(`/expenses/acc-mgr-upd-status/${expense.requestId}`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Approve response:', response.data);

      setExpenses((prev) =>
        activeTab === 'pending'
          ? prev.filter((e) => e.requestId !== expense.requestId)
          : prev.map((e) =>
              e.requestId === expense.requestId ? { ...e, status: 'Approved' } : e
            )
      );
      Swal.fire('Success', 'Expense approved successfully', 'success');
    } catch (err) {
      console.error('Approve failed:', err, err.response?.data);
      setError(`Failed to approve expense: ${err.message}`);
      Swal.fire('Error', `Failed to approve expense: ${err.message}`, 'error');
    }
  };

  const handleReject = async (expense) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('Missing account manager ID. Please log in.');
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
      
      // Log FormData contents
      console.log('FormData for reject:', {
        acc_mgr_id: form.get('acc_mgr_id'),
        status: form.get('status'),
        reason: form.get('reason'),
      });

      const response = await api.put(`/expenses/acc-mgr-upd-status/${expense.requestId}`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Reject response:', response.data);

      setExpenses((prev) =>
        activeTab === 'pending'
          ? prev.filter((e) => e.requestId !== expense.requestId)
          : prev.map((e) =>
              e.requestId === expense.requestId ? { ...e, status: 'Rejected' } : e
            )
      );
      Swal.fire('Success', 'Expense rejected successfully', 'success');
    } catch (err) {
      console.error('Reject failed:', err, err.response?.data);
      setError(`Failed to reject expense: ${err.message}`);
      Swal.fire('Error', `Failed to reject expense: ${err.message}`, 'error');
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
    console.log('Filtered expenses:', filtered);
    return filtered;
  }, [expenses, searchTerm, statusFilter]);

  // Client-side pagination
  const totalPages = Math.ceil(filteredExpenses.length / Number(perPage));
  const paginatedExpenses = filteredExpenses.slice(
    (page - 1) * Number(perPage),
    page * Number(perPage)
  );
  console.log('Paginated expenses:', paginatedExpenses);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

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
    console.log('useEffect - userId:', userId);
    if (!userId) {
      setError('Missing account manager ID. Please log in.');
      navigate('/login', { replace: true });
      return;
    }
    setUserId(userId);
    if (activeTab === 'pending') fetchPendingExpenses();
    else if (activeTab === 'all') fetchAllExpenses();
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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="px-6 py-10 text-center text-gray-600">Loading expenses...</div>
        ) : error ? (
          <div className="px-6 py-4 text-red-700 bg-red-50 border border-red-200">{error}</div>
        ) : (
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
                  <TableCell className="text-center text-gray-600 px-6 py-4">
                    {(page - 1) * Number(perPage) + index + 1}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full ${getAvatarColor(expense.employee.name)} flex items-center justify-center text-white font-medium text-sm`}
                      >
                        {expense.employee.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{expense.employee.name}</div>
                        <div className="text-sm text-gray-500">{expense.employee.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-700">{expense.category}</TableCell>
                  <TableCell className="px-6 py-4 font-medium text-gray-900">${expense.amount.toFixed(2)}</TableCell>
                  <TableCell className="px-6 py-4 text-gray-700">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-3 text-xs bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                      onClick={() => handleViewDetails(expense)}
                      aria-label={`View details for ${expense.category}`}
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
                        aria-label={`View details for expense ${expense.requestId}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                        onClick={() => handleApprove(expense)}
                        disabled={expense.status !== 'Pending'}
                        aria-label={`Approve expense ${expense.requestId}`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                        onClick={() => handleReject(expense)}
                        disabled={expense.status !== 'Pending'}
                        aria-label={`Reject expense ${expense.requestId}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Showing {paginatedExpenses.length} of {filteredExpenses.length} expenses</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => handlePageChange(page - 1)}
            aria-label="Previous page"
          >
            Previous
          </Button>
          <span>Page {page} of {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => handlePageChange(page + 1)}
            aria-label="Next page"
          >
            Next
          </Button>
        </div>
      </div>

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
                    className={`w-8 h-8 rounded-full ${getAvatarColor(selectedExpense.employee.name)} flex items-center justify-center text-white font-medium text-xs`}
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
                  <label className="text-sm font-medium text-gray-500">Amount</label>
                  <p className="text-lg font-bold text-gray-900">${selectedExpense.amount.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedExpense.status)}</div>
                </div>
              </div>
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
                        href={att.file_path}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 text-sm underline"
                        aria-label={`Download attachment ${att.file_name}`}
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
    </div>
  );
};

export default AccountManagerExpenseManagement;