import React, { useEffect, useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { Receipt, DollarSign, Calendar, Upload, X, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

// Backend base URL for API calls
const BASE_URL = 'http://127.0.0.1:8000';

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

  // Expense history loaded from API
  const [expenseHistory, setExpenseHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const expenseCategories = [
    'Travel',
    'Food',
    'Entertainment',
    'Office Supplies',
    'Software & Subscriptions',
    'Training & Education',
    'Communication',
    'Marketing',
    'Equipment',
    'Other'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setExpenseData(prev => ({
      ...prev,
      [name]: value
    }));
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
    if (receipt && receipt.preview) {
      URL.revokeObjectURL(receipt.preview);
    }
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
      case 'pending_manager_approval':
        return 'Pending Manager Approval';

      case 'approved':
      case 'pending_hr_approval':
        return 'Pending HR Approval';

      case 'approved':
      case 'pending_account_mgr_approval':
        return 'Pending Account Manager Approval';

        case 'rejected':
      case 'hr_rejected':
        return 'HR Rejected';

      case 'rejected':
      case 'mgr_rejected':
        return 'Manager Rejected';

       case 'rejected':
      case 'acc_mgr_rejected':
        return 'AccountManager Rejected';

      default:
        return item.manager_status || item.status || 'Pending';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      // Resolve employeeId from context or localStorage fallback
      let employeeId = user?.employeeId;
      if (!employeeId) {
        try {
          const stored = localStorage.getItem('userData');
          if (stored) {
            const parsed = JSON.parse(stored);
            employeeId = parsed?.employeeId;
          }
        } catch (_) {}
      }
      if (!employeeId) throw new Error('Employee ID not found. Please log in.');

      const form = new FormData();
      form.append('employee_id', Number(employeeId));
      form.append('category', expenseData.category || 'Other');
      form.append('amount', parseFloat(expenseData.amount || 0));
      form.append('currency', expenseData.currency || 'INR');
      form.append('description', expenseData.description || expenseData.title || '');
      form.append('expense_date', expenseData.date);
      form.append('tax_included', expenseData.tax_included);
      if (receipts[0]?.file) {
        form.append('file', receipts[0].file);
      }

      const res = await fetch(`${BASE_URL}/expenses/submit-exp`, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Failed to submit expense');
      }

      const data = await res.json();
      setMessage(`Expense submitted successfully! Reference: ${data.request_code || data.request_id}`);

      // Reset form after success
      setExpenseData({
        category: '',
        amount: '',
        currency: 'INR',
        date: new Date().toISOString().split('T')[0],
        description: '',
        tax_included: false,
      });
      receipts.forEach(receipt => {
        if (receipt.preview) {
          URL.revokeObjectURL(receipt.preview);
        }
      });
      setReceipts([]);

      // Refresh history for current month
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const histRes = await fetch(`${BASE_URL}/expenses/my-expenses?employee_id=${employeeId}&year=${year}&month=${month}`);
        if (histRes.ok) {
          const histData = await histRes.json();
          const mapped = (histData || []).map((item) => {
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
          setExpenseHistory(mapped);
        }
      } catch (_) {}
    } catch (error) {
      setMessage(error.message || 'Failed to submit expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load expense history on mount for current month
  useEffect(() => {
    const loadHistory = async () => {
      setHistoryLoading(true);
      setHistoryError('');
      try {
        // Resolve employeeId from context or localStorage fallback
        let employeeId = user?.employeeId;
        if (!employeeId) {
          try {
            const stored = localStorage.getItem('userData');
            if (stored) {
              const parsed = JSON.parse(stored);
              employeeId = parsed?.employeeId;
            }
          } catch (_) {}
        }
        if (!employeeId) throw new Error('Employee ID not found. Please log in.');
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const res = await fetch(`${BASE_URL}/expenses/my-expenses?employee_id=${employeeId}&year=${year}&month=${month}`);
        if (!res.ok) throw new Error('Failed to load expenses');
        const data = await res.json();
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
             status: mapStatus(item),
            approvals,
          };
        });
        setExpenseHistory(mapped);
      } catch (err) {
        setHistoryError(err.message || 'Error loading history');
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Receipt className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-card-foreground">Submit Expense</h2>
            <p className="text-sm text-muted-foreground">Submit your business expense for reimbursement</p>
          </div>
        </div>
        <Tabs defaultValue="submit" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="submit">Submit Expense</TabsTrigger>
            <TabsTrigger value="history">Expense History</TabsTrigger>
          </TabsList>
          <TabsContent value="submit">

        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            message.includes('success') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.includes('success') ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                Category *
              </label>
              <select
                name="category"
                value={expenseData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              >
                <option value="">Select category</option>
                {expenseCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
               
                Amount *
              </label>
              <input
                type="number"
                name="amount"
                value={expenseData.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                Currency *
              </label>
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
              <label className="block text-sm font-medium text-card-foreground mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={expenseData.date}
                onChange={handleInputChange}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Tax Included Checkbox */}
          <div className="flex items-center gap-2">
            <input
              id="tax_included"
              name="tax_included"
              type="checkbox"
              checked={expenseData.tax_included}
              onChange={(e) => setExpenseData(prev => ({ ...prev, tax_included: e.target.checked }))}
              className="h-4 w-4 border border-border rounded"
            />
            <label htmlFor="tax_included" className="text-sm text-card-foreground">
              Tax included
            </label>
          </div>

          

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
             Description *
            </label>
            <textarea
              name="description"
              value={expenseData.description}
              onChange={handleInputChange}
              placeholder="Any additional details about the expense..."
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                required
              
            />
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              <Upload className="inline h-4 w-4 mr-1" />
              Upload Receipts *
            </label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <div className="text-center">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Upload receipt images (JPG, PNG, PDF - Max 5MB each)
                </p>
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
                  className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                >
                  Select Files
                </Button>
              </div>
            </div>

            {/* Receipt Preview */}
            {receipts.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {receipts.map((receipt) => (
                  <div key={receipt.id} className="relative border border-border rounded-lg p-2">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                      {receipt.file.type.startsWith('image/') ? (
                        <img
                          src={receipt.preview}
                          alt={receipt.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Receipt className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <p className="text-xs text-card-foreground truncate">{receipt.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(receipt.size)}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveReceipt(receipt.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 p-0 bg-red-100 hover:bg-red-200 text-red-600 rounded-full"
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
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </div>
              ) : (
                'Submit Expense'
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setExpenseData({
                
                  category: '',
                  amount: '',
                  currency: 'INR',
                  date: new Date().toISOString().split('T')[0],
                  description: ''
                  
                });
                receipts.forEach(receipt => {
                  if (receipt.preview) {
                    URL.revokeObjectURL(receipt.preview);
                  }
                });
                setReceipts([]);
                setMessage('');
              }}
              className="px-6"
            >
              Reset
            </Button>
          </div>
        </form>
          </TabsContent>

          <TabsContent value="history">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expense Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>
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
                      <TableCell>
                        <span className={`${item.status === 'Approved' ? 'text-green-700 bg-green-50 border border-green-200' : item.status === 'Rejected' ? 'text-red-700 bg-red-50 border border-red-200' : 'text-yellow-700 bg-yellow-50 border border-yellow-200'} px-2 py-1 rounded-md text-xs`}>{item.status}</span>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-blue-800">
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
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SubmitExpense;