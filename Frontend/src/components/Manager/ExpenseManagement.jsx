import React, { useEffect, useMemo, useState } from 'react';
import {
  Eye,
  Search,
  Filter,
  Plus,
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
import { toast } from 'react-toastify';
import api from '@/lib/api'; // Assuming expensesAPI is now part of the main api
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
import NewExpenseForm from '@/components/Manager/NewExpenseForm';
import { avatarBg } from '../../lib/avatarColors';
import { PaginationControls, usePagination } from '@/components/ui/pagination-controls';

const ManagerExpenseManagement = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('pending');
  const [expenses, setExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
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
    switch (status?.toLowerCase()) {
      case 'pending_manager_approval':
        return 'Pending';
      case 'pending_hr_approval':
      case 'approved':
        return 'Approved';
      case 'mgr_rejected':
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
    category: item.category,
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
    category: item.category,
    date: formatDate(item.expense_date),
    amount: Number(item.amount || 0),
    currency: item.currency || 'INR',
    description: item.description || '',
    status: mapStatus(item.status),
    approvals: item.history?.map(h => ({
      name: h.action_by_name,
      role: h.action_role,
      reason: h.reason || '-',
      status: mapStatus(h.action),
    })) || [],
  });

  const fetchExpenses = async (year = selectedYear, month = selectedMonth) => {
    if (!user?.employeeId) return;
    setLoading(true);
    try {
      const response = await api.get('/expenses/mgr-exp-list', {
        params: { manager_id: user.employeeId, year, month },
        headers: { Authorization: `Bearer ${token}` },
      });
      const mapped = (response.data || []).map(mapExpense);
      if (activeTab === 'pending') {
        setExpenses(mapped.filter((e) => e.status.toLowerCase() === 'pending'));
      } else {
        setExpenses(mapped);
      }
    } catch (err) {
      console.error('Fetch expenses failed:', err);
      setError('Failed to fetch expenses');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyExpenses = async (year = selectedYear, month = selectedMonth) => {
    if (!user?.employeeId) {
      setMyError('Missing employee id');
      return;
    }
    setMyLoading(true);
    setMyError(null);
    try {
      const response = await api.get('/expenses/my-expenses', {
        params: { employee_id: user.employeeId, year, month },
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyExpenses((response.data || []).map(mapMyExpense));
    } catch (err) {
      console.error('Error fetching my-expenses:', err);
      setMyError('Failed to fetch my expense history.');
      setMyExpenses([]);
    } finally {
      setMyLoading(false);
    }
  };

  const handleFilterChange = () => {
    if (activeTab === 'my') {
      fetchMyExpenses(selectedYear, selectedMonth);
    } else {
      fetchExpenses(selectedYear, selectedMonth);
    }
  };

  useEffect(() => {
    if (activeTab === 'my') {
      fetchMyExpenses();
    } else {
      fetchExpenses();
    }
  }, [activeTab, user?.employeeId, selectedYear, selectedMonth]);

  const handleViewDetails = (expense) => {
    setSelectedExpense(expense);
    setIsDetailsOpen(true);
  };

  const handleNewExpenseSuccess = () => {
    setIsNewExpenseOpen(false);
    if (activeTab === 'my') {
      fetchMyExpenses();
    } else {
      fetchExpenses();
    }
  };

  const handleApprove = async (expense) => {
    try {
      const reason = await Swal.fire({
        title: 'Approve Expense',
        input: 'textarea',
        inputLabel: 'Reason (optional)',
        inputPlaceholder: 'Enter approval reason...',
        inputAttributes: { 'aria-label': 'Enter approval reason' },
        showCancelButton: true,
        confirmButtonText: 'Submit',
      });
      if (!reason.isConfirmed) return;

      const formData = new FormData();
      formData.append('manager_id', user.employeeId);
      formData.append('status', 'Approved');
      formData.append('reason', (reason.value || '-').trim() || '-');

      await api.put(`/expenses/mgr-upd-status/${expense.requestId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Expense approved successfully!');
      setExpenses((prev) =>
        activeTab === 'pending'
          ? prev.filter((e) => e.requestId !== expense.requestId)
          : prev.map((e) =>
            e.requestId === expense.requestId ? { ...e, status: 'Approved' } : e
          )
      );
    } catch (err) {
      console.error('Approve failed:', err);
      toast.error('Failed to approve expense.');
    }
  };

  const handleReject = async (expense) => {
    try {
      const reason = await Swal.fire({
        title: 'Reject Expense',
        input: 'textarea',
        inputLabel: 'Reason (optional)',
        inputPlaceholder: 'Enter rejection reason...',
        inputAttributes: { 'aria-label': 'Enter rejection reason' },
        showCancelButton: true,
        confirmButtonText: 'Submit',
      });
      if (!reason.isConfirmed) return;

      const formData = new FormData();
      formData.append('manager_id', user.employeeId);
      formData.append('status', 'Rejected');
      formData.append('reason', (reason.value || '-').trim() || '-');

      await api.put(`/expenses/mgr-upd-status/${expense.requestId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Expense rejected successfully!');
      setExpenses((prev) =>
        activeTab === 'pending'
          ? prev.filter((e) => e.requestId !== expense.requestId)
          : prev.map((e) =>
            e.requestId === expense.requestId ? { ...e, status: 'Rejected' } : e
          )
      );
    } catch (err) {
      console.error('Reject failed:', err);
      toast.error('Failed to reject expense.');
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
    const excludePendingInAll =
      activeTab === 'all' ? (expense.status || '').toLowerCase() !== 'pending' : true;
    return matchesSearch && matchesStatus && excludePendingInAll;
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

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Expense Management</h1>
          <p className="text-gray-600 mt-1">Review and approve team expense claims</p>
        </div>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => setIsNewExpenseOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Expense
        </Button>
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Per Page:</span>
            <Select value={String(pageSize)} onValueChange={(value) => handlePageSizeChange(Number(value))}>
              <SelectTrigger className="w-16 h-8">
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
      <div className="mb-2">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Pending Requests
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              All Expense Request
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'my'
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
          {myLoading ? (
            <div className="px-6 py-10 text-center text-gray-600">Loading expenses...</div>
          ) : myError ? (
            <div className="px-6 py-4 text-red-700 bg-red-50 border border-red-200">{myError}</div>
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
                          <Button variant="outline" size="sm" className="h-7 px-3 text-xs bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100">
                            <FileText className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl p-0">
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
                                <div className="font-medium text-gray-800">{item.final_amount} {item.currency}</div>
                              </div>
                              <div className="rounded-lg p-4 bg-white">
                                <div className="text-gray-500">Description</div>
                                <div className="font-medium text-gray-800">{item.description}</div>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className={`${item.status === 'Approved' ? 'text-green-700 bg-green-50 border border-green-200' :
                          item.status === 'Rejected' ? 'text-red-700 bg-red-50 border border-red-200' :
                            'text-yellow-700 bg-yellow-50 border border-yellow-200'
                        } px-2 py-1 rounded-md text-xs`}>{item.status}</span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-blue-800 hover:text-blue-800 text-blue-700">
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
                                      className={`${appr.status === "Approved"
                                          ? "text-green-700 bg-green-50 border border-green-200"
                                          : appr.status === "Rejected"
                                            ? "text-red-700 bg-red-50 border border-red-200"
                                            : "text-yellow-700 bg-yellow-50 border border-yellow-200"
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
                  <TableHead className="text-center font-semibold text-gray-700 px-6 py-4">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedExpenses.map((expense, index) => (
                  <TableRow key={expense.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <TableCell className="text-center text-gray-600 px-6 py-4">{(currentPage - 1) * pageSize + index + 1}</TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full ${getAvatarColor(expense.employee.name)} flex items-center justify-center text-white font-medium text-sm`}
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
                      {new Intl.NumberFormat(undefined, { style: 'currency', currency: expense.currency || 'INR' }).format(expense.final_amount)}
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
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-800 hover:bg-blue-500"
                          onClick={() => handleViewDetails(expense)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
            pageSizeOptions={[10, 25, 50, 100]}
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
            pageSizeOptions={[10, 25, 50, 100]}
          />
        )
      )}

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-md w-full max-h-[90vh] flex flex-col">
          <DialogHeader className="mb-4 flex-shrink-0">
            <DialogTitle className="text-lg font-semibold text-gray-900">Expense Details</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Complete information about the expense request
            </DialogDescription>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4 text-sm text-gray-700 overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500">Request ID</span>
                  <p className="text-sm font-semibold text-gray-900">{selectedExpense.requestId}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">Category</span>
                  <p className="text-sm font-semibold text-gray-900">{selectedExpense.category}</p>
                </div>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500">Employee</span>
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
                  <span className="text-xs font-medium text-gray-500">Base Amount</span>
                  <p className="text-lg font-bold text-gray-900">
                    {new Intl.NumberFormat(undefined, { style: 'currency', currency: selectedExpense.currency || 'INR' }).format(selectedExpense.amount)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">Status</span>
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
                <span className="text-xs font-medium text-gray-500">Submitted On</span>
                <p className="text-sm text-gray-900">{selectedExpense.submittedOn}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500">Details</span>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md border">{selectedExpense.details}</p>
              </div>
              {selectedExpense.attachments?.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-gray-500">Attachments</span>
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
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isNewExpenseOpen} onOpenChange={setIsNewExpenseOpen}>
        <DialogContent className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-lg w-full">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-semibold text-gray-900">New Expense</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">Submit a new expense request</DialogDescription>
          </DialogHeader>
          <NewExpenseForm
            onSuccess={handleNewExpenseSuccess}
            onCancel={() => setIsNewExpenseOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerExpenseManagement;