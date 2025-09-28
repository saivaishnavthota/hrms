import React, { useEffect, useMemo, useState } from 'react';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Plus,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  Check,
  X,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Swal from 'sweetalert2';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogBody,
} from '@/components/ui/dialog';
import { useUser } from '@/contexts/UserContext';
import NewExpenseForm from '@/components/Manager/NewExpenseForm';
import { avatarBg } from '../../lib/avatarColors';
import api from '@/lib/api';


const ExpenseManagement = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('pending');
  const [expenses, setExpenses] = useState([]);
  const [myHistory, setMyHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [perPage, setPerPage] = useState('10');
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Authorization is handled by axios interceptor in '@/lib/api'

  // Compute current year/month to satisfy backend validation when required
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Filters: selected year/month
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

  const mapStatus = (item) => {
    const s = (item.hr_status || item.status || '').toLowerCase();
    switch (s) {
      case 'pending_hr_approval':
      case 'pending':
        return 'Pending';
      case 'approved':
      case 'carried_forward':
      case 'pending_account_mgr_approval':
        return 'Approved';
      case 'rejected':
      case 'hr_rejected':
        return 'Rejected';
      default:
        return item.hr_status || item.status || 'Pending';
    }
  };

  const mapExpense = (item) => ({
    id: item.request_id || item.id,
    requestId: item.request_id || item.id,
    employee: {
      name: item.employeeName || item.employee_name || item.employee || 'Unknown',
      email: item.employeeEmail || item.employee_email || item.email || '',
      avatar: getInitials(
        item.employeeName || item.employee_name || item.employee || 'U'
      ),
    },
    category: item.category,
    amount: Number(item.amount || 0),
    details: item.description || '',
    submittedOn: formatDate(
      item.submitted_at || item.created_at || item.expense_date || item.date
    ),
    status: mapStatus(item),
    attachments:
      item.attachments ||
      (item.attachment
        ? [{ file_name: 'Attachment', file_path: item.attachment }]
        : item.attachment_url
        ? [{ file_name: 'Attachment', file_path: item.attachment_url }]
        : []),
  });

  const fetchPendingExpenses = async () => {
    if (!user?.employeeId) {
      setError('Missing hr id');
      return;
    }
    setLoading(true);
    setError(null);
  try {
      const { data } = await api.get('/expenses/hr-exp-list', {
        params: {
          hr_id: user.employeeId,
          year: Number(selectedYear),
          month: Number(selectedMonth),
        },
        headers: {
          // Backend can use Authorization header to read HR ID if needed
          Authorization: String(user.employeeId || ''),
        },
      });
      const mapped = (data || []).map(mapExpense);
      setExpenses(mapped.filter((e) => (e.status || '').toLowerCase() === 'pending'));
    } catch (err) {
      console.error('Error fetching hr-exp-list (pending):', err);
      setError('Failed to fetch pending requests.');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllExpenses = async () => {
    if (!user?.employeeId) {
      setError('Missing hr id');
      return;
    }
    setLoading(true);
    setError(null);
  try {
      const { data } = await api.get('/expenses/hr-exp-list', {
        params: {
          hr_id: user.employeeId,
          year: Number(selectedYear),
          month: Number(selectedMonth),
        },
        headers: {
          Authorization: String(user.employeeId || ''),
        },
      });
      setExpenses((data || []).map(mapExpense));
    } catch (err) {
      console.error('Error fetching hr-exp-list:', err);
      setError('Failed to fetch expense list.');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyExpenses = async () => {
    // HR can view own submitted expenses using same endpoint as Employee history
    if (!user?.employeeId) {
      setError('Missing hr id');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/expenses/my-expenses', {
        params: {
          employee_id: user.employeeId,
          year: Number(selectedYear),
          month: Number(selectedMonth),
        },
        headers: {
          Authorization: String(user.employeeId || ''),
        },
      });
      const mapped = (data || []).map((item) => {
        const approvals = Array.isArray(item.history)
          ? item.history
              .filter((h) => h.action_role === 'Manager' || h.action_role === 'HR')
              .map((h) => ({
                name: h.action_by_name || h.action_role,
                role: h.action_role,
                reason: h.reason || '-',
                status: h.action,
              }))
          : [];
        return {
          id: item.request_id,
          date: (item.expense_date || '').toString().slice(0, 10),
          category: item.category,
          amount: item.amount,
          currency: item.currency,
          description: item.description || '',
          status: item.status,
          approvals,
        };
      });
      setMyHistory(mapped);
    } catch (err) {
      console.error('Error fetching my-expenses:', err);
      setError('Failed to fetch my expenses.');
      setMyHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pending') fetchPendingExpenses();
    else if (activeTab === 'all') fetchAllExpenses();
    else if (activeTab === 'my') fetchMyExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user?.employeeId, selectedYear, selectedMonth]);

  const handleViewDetails = (expense) => {
    setSelectedExpense(expense);
    setIsDetailsOpen(true);
  };

  const handleNewExpenseSuccess = () => {
    setIsNewExpenseOpen(false);
    if (activeTab === 'pending') {
      fetchPendingExpenses();
    } else if (activeTab === 'all') {
      fetchAllExpenses();
    } else if (activeTab === 'my') {
      fetchMyExpenses();
    }
  };

  const handleApprove = async (expense) => {
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

      // Use backend's hr status update endpoint with form-data (id-based)
      const form = new FormData();
      form.append('hr_id', String(user.employeeId || ''));
      form.append('status', 'Approved');
      form.append('reason', reason);
      await api.put(`/expenses/hr-upd-status/${expense.requestId}`, form, {
        headers: {
          Authorization: String(user.employeeId || ''),
        },
      });
      setExpenses((prev) =>
        activeTab === 'pending'
          ? prev.filter((e) => e.requestId !== expense.requestId)
          : prev.map((e) =>
              e.requestId === expense.requestId ? { ...e, status: 'Approved' } : e
            )
      );
    } catch (err) {
      console.error('Approve failed:', err);
      setError('Failed to approve expense.');
    }
  };

  const handleReject = async (expense) => {
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

      // Use backend's hr status update endpoint with form-data (id-based)
      const form = new FormData();
      form.append('hr_id', String(user.employeeId || ''));
      form.append('status', 'Rejected');
      form.append('reason', reason);
      await api.put(`/expenses/hr-upd-status/${expense.requestId}`, form, {
        headers: {
          Authorization: String(user.employeeId || ''),
        },
      });
      setExpenses((prev) =>
        activeTab === 'pending'
          ? prev.filter((e) => e.requestId !== expense.requestId)
          : prev.map((e) =>
              e.requestId === expense.requestId ? { ...e, status: 'Rejected' } : e
            )
      );
    } catch (err) {
      console.error('Reject failed:', err);
      setError('Failed to reject expense.');
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

  const filteredMyHistory = myHistory.filter((item) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (item.category || '').toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === 'all' ||
      (item.status || '').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

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
    <div className="p-6 space-y-6">
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

          {/* Month filter */}
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
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

          {/* Year filter */}
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="px-6 py-10 text-center text-gray-600">Loading expenses...</div>
        ) : error ? (
          <div className="px-6 py-4 text-red-700 bg-red-50 border border-red-200">{error}</div>
        ) : activeTab === 'my' ? (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">Expense Category</TableHead>
                <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">Date</TableHead>
                <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">Details</TableHead>
                <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">Status</TableHead>
                <TableHead className="text-left font-semibold text-gray-700 px-6 py-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMyHistory.map((item) => (
                <TableRow key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <TableCell className="px-6 py-4 text-gray-700">{item.category}</TableCell>
                  <TableCell className="px-6 py-4 text-gray-700">{item.date}</TableCell>
                  <TableCell className="px-6 py-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">View Details</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Submitted Expense Details</DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div><span className="text-muted-foreground">Category:</span> {item.category}</div>
                            <div><span className="text-muted-foreground">Date:</span> {item.date}</div>
                            <div><span className="text-muted-foreground">Amount:</span> {item.amount} {item.currency}</div>
                            <div className="md:col-span-2"><span className="text-muted-foreground">Description:</span> {item.description || '-'}</div>
                            <div><span className="text-muted-foreground">Status:</span> {item.status}</div>
                          </div>
                        </DialogBody>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className={`${item.status === 'Approved' ? 'text-green-700 bg-green-50 border border-green-200' : item.status === 'Rejected' ? 'text-red-700 bg-red-50 border border-red-200' : 'text-yellow-700 bg-yellow-50 border border-yellow-200'} px-2 py-1 rounded-md text-xs`}>{item.status}</span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Manager & HR Details</DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                          <div className="rounded-lg border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Role</TableHead>
                                  <TableHead>Reason</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {item.approvals.map((appr, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{appr.name}</TableCell>
                                    <TableCell>{appr.role}</TableCell>
                                    <TableCell>{appr.reason || '-'}</TableCell>
                                    <TableCell>
                                      <span className={`${appr.status === 'Approved' ? 'text-green-700 bg-green-50 border border-green-200' : appr.status === 'Rejected' ? 'text-red-700 bg-red-50 border border-red-200' : 'text-yellow-700 bg-yellow-50 border border-yellow-200'} px-2 py-1 rounded-md text-xs`}>{appr.status}</span>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </DialogBody>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
              {filteredExpenses.map((expense, index) => (
                <TableRow key={expense.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <TableCell className="text-center text-gray-600 px-6 py-4">{index + 1}</TableCell>
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
                  <TableCell className="px-6 py-4 font-medium text-gray-900">${expense.amount.toFixed(2)}</TableCell>
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
                  <TableCell className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        expense.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : expense.status === 'Approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {expense.status}
                    </span>
                  </TableCell>
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

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {activeTab === 'my'
            ? `Showing ${filteredMyHistory.length} of ${myHistory.length} expenses`
            : `Showing ${filteredExpenses.length} of ${expenses.length} expenses`}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600">
            1
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
            <DialogDescription>
              Complete information about the expense request
            </DialogDescription>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit New Expense</DialogTitle>
            <DialogDescription>Create a new expense request</DialogDescription>
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

export default ExpenseManagement;