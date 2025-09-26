import React, { useState } from 'react';
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
} from '@/components/ui/dialog';

// Sample expense data
const sampleExpenses = [
  {
    id: 1,
    employee: {
      name: "Dr. Sarah Johnson",
      email: "sarah.johnson@example.com",
      avatar: "SJ"
    },
    category: "Travel",
    amount: 1250.00,
    details: "Business trip to New York - Flight and accommodation",
    submittedOn: "2025-01-15",
    status: "Pending",
    requestId: "EXP001"
  },
  {
    id: 2,
    employee: {
      name: "Mr. John Smith",
      email: "john.smith@example.com",
      avatar: "JS"
    },
    category: "Meals",
    amount: 85.50,
    details: "Client dinner at downtown restaurant",
    submittedOn: "2025-01-14",
    status: "Approved",
    requestId: "EXP002"
  },
  {
    id: 3,
    employee: {
      name: "Ms. Emily Davis",
      email: "emily.davis@example.com",
      avatar: "ED"
    },
    category: "Office Supplies",
    amount: 245.75,
    details: "Laptop accessories and stationery items",
    submittedOn: "2025-01-13",
    status: "Rejected",
    requestId: "EXP003"
  },
  {
    id: 4,
    employee: {
      name: "Dr. Michael Wilson",
      email: "michael.wilson@example.com",
      avatar: "MW"
    },
    category: "Training",
    amount: 850.00,
    details: "Professional development course certification",
    submittedOn: "2025-01-12",
    status: "Pending",
    requestId: "EXP004"
  },
  {
    id: 5,
    employee: {
      name: "Ms. Lisa Brown",
      email: "lisa.brown@example.com",
      avatar: "LB"
    },
    category: "Transportation",
    amount: 125.30,
    details: "Taxi fare for client meetings",
    submittedOn: "2025-01-11",
    status: "Approved",
    requestId: "EXP005"
  }
];

const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState(sampleExpenses);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [perPage, setPerPage] = useState('10');
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500'
    ];
    return colors[name.length % colors.length];
  };

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
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
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
    }
  };

  const handleViewDetails = (expense) => {
    setSelectedExpense(expense);
    setIsDetailsOpen(true);
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || expense.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const ActionButton = ({ icon: Icon, onClick, variant = "ghost", size = "sm", className = "" }) => (
    <Button
      variant={variant}
      size={size}
      mode="icon"
      onClick={onClick}
      className={`h-8 w-8 p-0 ${className}`}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Expense Management</h1>
          <p className="text-gray-600 mt-1">Review and approve employee expense claims</p>
        </div>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          New Expense
        </Button>
      </div>

      {/* Search and Filters */}
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

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
                    <div className={`w-10 h-10 rounded-full ${getAvatarColor(expense.employee.name)} flex items-center justify-center text-white font-medium text-sm`}>
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
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    expense.status === 'Pending' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : expense.status === 'Approved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {expense.status}
                  </span>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-600 hover:bg-green-50">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50">
                      <X className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Info */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Showing {filteredExpenses.length} of {expenses.length} expenses</span>
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

      {/* Details Popup Dialog */}
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
                  <div className={`w-8 h-8 rounded-full ${getAvatarColor(selectedExpense.employee.name)} flex items-center justify-center text-white font-medium text-xs`}>
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
                  <div className="mt-1">
                    {getStatusBadge(selectedExpense.status)}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Submitted On</label>
                <p className="text-sm text-gray-900">{selectedExpense.submittedOn}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Details</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md border">{selectedExpense.details}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseManagement;