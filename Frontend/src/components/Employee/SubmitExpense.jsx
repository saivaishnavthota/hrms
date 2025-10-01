import React, { useEffect, useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { Receipt, DollarSign, Calendar, Upload, X, CheckCircle, AlertCircle, Trash2,Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import api, { expensesAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import { markDeleted, filterListByDeleted } from '../../lib/localDelete';

const SubmitExpense = () => {
  const { user } = useUser();
  const [expenseData, setExpenseData] = useState({
    title: '',
    category: '',
    amount: '',
    currency: 'INR',
    date: new Date().toISOString().split('T')[0],
    description: '',
    tax_included: false,
  });
  const [receipts, setReceipts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [expenseHistory, setExpenseHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // popup states
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);

  const expenseCategories = [
    'Travel', 'Food', 'Entertainment', 'Office Supplies', 'Software & Subscriptions',
    'Training & Education', 'Communication', 'Marketing', 'Equipment', 'Other'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setExpenseData(prev => ({ ...prev, [name]: value }));
  };

  const handleReceiptUpload = (e) => {
    const files = Array.from(e.target.files);
    const newReceipts = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      preview: URL.createObjectURL(file)
    }));
    setReceipts(prev => [...prev, ...newReceipts]);
  };

  const handleRemoveReceipt = (id) => {
    const receipt = receipts.find(r => r.id === id);
    if (receipt?.preview) URL.revokeObjectURL(receipt.preview);
    setReceipts(prev => prev.filter(r => r.id !== id));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const mapStatus = (item) => {
    const s = (item.manager_status || item.status || '').toLowerCase();
    switch (s) {
      case 'pending':
      case 'pending_manager_approval': return 'Pending Manager Approval';
      case 'pending_hr_approval': return 'Pending HR Approval';
      case 'pending_account_mgr_approval': return 'Pending Account Manager Approval';
      case 'approved': return 'Approved';
      case 'hr_rejected': return 'HR Rejected';
      case 'mgr_rejected': return 'Manager Rejected';
      case 'acc_mgr_rejected': return 'Account Manager Rejected';
      default: return item.manager_status || item.status || 'Pending';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      let employeeId = user?.employeeId || JSON.parse(localStorage.getItem('userData') || '{}')?.employeeId;
      if (!employeeId) throw new Error('Employee ID not found. Please log in.');

      const expensePayload = {
        employee_id: Number(employeeId),
        category: expenseData.category || 'Other',
        amount: parseFloat(expenseData.amount || 0),
        currency: expenseData.currency || 'INR',
        description: expenseData.description || expenseData.title || '',
        expense_date: expenseData.date,
        tax_included: expenseData.tax_included
      };

      const res = await expensesAPI.submitExpense(expensePayload);

      toast.success(`Expense submitted successfully! Reference: ${res.data.request_code || res.data.request_id}`);

      setExpenseData({
        category: '', amount: '', currency: 'INR', date: new Date().toISOString().split('T')[0],
        description: '', tax_included: false
      });
      receipts.forEach(r => r.preview && URL.revokeObjectURL(r.preview));
      setReceipts([]);

      await loadExpenseHistory(employeeId);

    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to submit expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadExpenseHistory = async (employeeId, year = selectedYear, month = selectedMonth) => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      if (!employeeId) return;

      const res = await expensesAPI.getMyExpenses({ employee_id: employeeId, year, month });
      
      console.log('Expense API Response:', res);
      console.log('Employee ID:', employeeId, 'Year:', year, 'Month:', month);

      const mapped = (res || []).map((item) => {
        const approvals = Array.isArray(item.history)
          ? item.history.filter(h => ['Manager', 'HR'].includes(h.action_role))
            .map(h => ({ name: h.action_by_name || h.action_role, role: h.action_role, reason: h.reason || '-', status: h.action }))
          : [];
        return {
          id: item.request_id,
          date: (item.expense_date || '').slice(0, 10),
          category: item.category,
          amount: item.amount,
          currency: item.currency,
          description: item.description || '',
          status: mapStatus(item),
          approvals
        };
      });

      setExpenseHistory(mapped);
    } catch (err) {
      console.error('Error loading expense history:', err);
      console.error('Error response:', err.response);
      setHistoryError(err.response?.data?.message || err.message || 'Error loading history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = () => {
    const employeeId = user?.employeeId || JSON.parse(localStorage.getItem('userData') || '{}')?.employeeId;
    if (employeeId) loadExpenseHistory(employeeId, selectedYear, selectedMonth);
  };

  useEffect(() => {
    const employeeId = user?.employeeId || JSON.parse(localStorage.getItem('userData') || '{}')?.employeeId;
    if (employeeId) loadExpenseHistory(employeeId, selectedYear, selectedMonth);
  }, [user, selectedYear, selectedMonth]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* --- Popup Card for Eye button --- */}
      {showProjectModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-gray-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-gray-600 to-blue-600 rounded-t-xl">
              <h3 className="text-lg font-semibold text-white">
                Expense Details – {new Date(selectedRecord.date).toLocaleDateString('en-US')}
              </h3>
              <button
                onClick={() => setShowProjectModal(false)}
                className="text-gray-300 hover:text-white transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg p-4 bg-white">
                  <div className="text-gray-500">Category</div>
                  <div className="font-medium text-gray-800">{selectedRecord.category}</div>
                </div>
                <div className="rounded-lg p-4 bg-white">
                  <div className="text-gray-500">Date</div>
                  <div className="font-medium text-gray-800">{selectedRecord.date}</div>
                </div>
                <div className="rounded-lg p-4 bg-white">
                  <div className="text-gray-500">Amount</div>
                  <div className="font-medium text-gray-800">
                    {selectedRecord.amount} {selectedRecord.currency}
                  </div>
                </div>
                <div className="rounded-lg p-4 bg-white">
                  <div className="text-gray-500">Status</div>
                  <div className="font-medium text-gray-800">{selectedRecord.status}</div>
                </div>
              </div>

              <div className="rounded-lg p-4 bg-white">
                <div className="text-gray-500">Description</div>
                <div className="font-medium text-gray-800">{selectedRecord.description || '-'}</div>
              </div>

              {/* Approvals Section */}
              <div className="rounded-lg p-4 bg-white">
                <h4 className="text-gray-700 font-semibold mb-3">Manager & HR Approvals</h4>
                {selectedRecord.approvals && selectedRecord.approvals.length > 0 ? (
                  <div className="space-y-2">
                    {selectedRecord.approvals.map((appr, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 border rounded-md text-sm"
                      >
                        <div>
                          <div className="font-medium text-gray-800">{appr.name}</div>
                          <div className="text-xs text-gray-500">{appr.role}</div>
                        </div>
                        <div className="text-gray-600">{appr.reason}</div>
                        <span
                          className={`px-2 py-1 rounded-md text-xs ${
                            appr.status === 'Approved'
                              ? 'text-green-700 bg-green-50 border border-green-200'
                              : appr.status === 'Rejected'
                              ? 'text-red-700 bg-red-50 border border-red-200'
                              : 'text-yellow-700 bg-yellow-50 border border-yellow-200'
                          }`}
                        >
                          {appr.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No approval history available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit & History Tabs */}
      <div className="bg-card rounded-lg shadow-sm border p-6">
        <Tabs defaultValue="submit" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="submit">Submit Expense</TabsTrigger>
            <TabsTrigger value="history">Expense History</TabsTrigger>
          </TabsList>

          {/* ---- Submit Expense Form ---- */}
          <TabsContent value="submit">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  name="category"
                  value={expenseData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Select category</option>
                  {expenseCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Amount, Currency, Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Amount *</label>
                  <input
                    type="number"
                    name="amount"
                    value={expenseData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Currency *</label>
                  <Select value={expenseData.currency} onValueChange={(val) => setExpenseData(prev => ({ ...prev, currency: val }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={expenseData.date}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  name="description"
                  value={expenseData.description}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg resize-none"
                  required
                />
              </div>

              {/* Receipt Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Upload Receipts *</label>
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleReceiptUpload}
                  className="hidden"
                  id="receipt-upload"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('receipt-upload').click()}
                >
                  Select Files
                </Button>

                {receipts.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {receipts.map((receipt) => (
                      <div key={receipt.id} className="relative border rounded-lg p-2">
                        <p className="text-xs truncate">{receipt.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(receipt.size)}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveReceipt(receipt.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 p-0 bg-red-100 text-red-600 rounded-full"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Expense'}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* ---- Expense History ---- */}
          {/* ---- Expense History ---- */}
<TabsContent value="history">
  {/* Filter Controls */}
  <div className="mb-4 flex gap-4 items-center">
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
  
  <div className="rounded-lg border">
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50">
          <TableHead className="w-12 text-center">S.No</TableHead>
          <TableHead>Expense Category</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {historyLoading ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading expense history...</span>
              </div>
            </TableCell>
          </TableRow>
        ) : historyError ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-red-600">
              Error: {historyError}
            </TableCell>
          </TableRow>
        ) : expenseHistory.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
              No expense requests found
            </TableCell>
          </TableRow>
        ) : (
          expenseHistory.map((item, index) => (
          <TableRow key={item.id} className="hover:bg-gray-50">
            {/* Serial Number */}
            <TableCell className="text-center font-medium">
              {index + 1}
            </TableCell>

            {/* Category */}
            <TableCell>
              <span className="text-gray-900 font-medium">{item.category}</span>
            </TableCell>

            {/* Amount */}
            <TableCell>
              <span className="text-gray-900">
                {item.amount} {item.currency}
              </span>
            </TableCell>

            {/* Date */}
            <TableCell>
              <span className="text-gray-700">{item.date}</span>
            </TableCell>

            {/* Status with Badge */}
            <TableCell>
              <span
                className={`px-2 py-1 rounded-md text-xs font-medium
                  ${item.status === 'Approved'
                    ? 'text-green-700 bg-green-100'
                    : item.status === 'Rejected'
                    ? 'text-red-700 bg-red-100'
                    : 'text-yellow-700 bg-yellow-100'
                }`}
              >
                {item.status}
              </span>
            </TableCell>

            {/* Actions */}
            <TableCell>
              <div className="flex items-center justify-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => {
                    setSelectedRecord(item);
                    setShowProjectModal(true);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>

                 <button 
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Delete"
                        onClick={() => {
                          try {
                            markDeleted('leaveRequests', item.id);
                          } catch (e) {
                            console.error('Error marking leave request deleted locally:', e);
                          }
                          setExpenseHistory(prev => prev.filter(r => r.id !== item.id));
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

              </div>
            </TableCell>
          </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
</TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default SubmitExpense;
