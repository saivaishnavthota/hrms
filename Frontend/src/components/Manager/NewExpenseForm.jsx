import React, { useMemo, useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { toast } from 'react-toastify';
import api from '@/lib/api';

const NewExpenseForm = ({ employeeIdOverride, onSuccess, onCancel }) => {
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
  const [receiptFile, setReceiptFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState();

  const token = useMemo(() => localStorage.getItem('authToken'), []);

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
    'Other',
  ];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setReceiptFile(file || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Determine employeeId
      let employeeId = employeeIdOverride || user?.employeeId;
      if (!employeeId) {
        const stored = localStorage.getItem('userData');
        if (stored) {
          const parsed = JSON.parse(stored);
          employeeId = parsed?.employeeId;
        }
      }
      if (!employeeId) throw new Error('Employee ID not found. Please log in.');

      if (!expenseData.category) throw new Error('Please select an expense category.');
      const amountNum = parseFloat(expenseData.amount);
      if (Number.isNaN(amountNum) || amountNum <= 0) throw new Error('Please enter a valid amount.');

      const form = new FormData();
      form.append('employee_id', Number(employeeId));
      form.append('category', expenseData.category || 'Other');
      form.append('amount', amountNum);
      form.append('currency', expenseData.currency || 'INR');
      form.append('description', expenseData.description || expenseData.title || '');
      form.append('expense_date', expenseData.date);
      form.append('tax_included', expenseData.tax_included);
      if (receiptFile) form.append('files', receiptFile); // Changed 'file' to 'files'

      const res = await api.post('/expenses/submit-exp', form, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success(`Expense submitted successfully! Reference: ${res.data.request_code || res.data.request_id}`);

      if (typeof onSuccess === 'function') onSuccess(res.data);

      // Reset form
      setExpenseData({
        title: '',
        category: '',
        amount: '',
        currency: 'INR',
        date: new Date().toISOString().split('T')[0],
        description: '',
        tax_included: false,
      });
      setReceiptFile(null);
      setMessage('');

    } catch (error) {
      console.error('Expense submission failed:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to submit expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Row 1: Category & Amount */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <Select value={expenseData.category} onValueChange={(val) => setExpenseData((p) => ({ ...p, category: val }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {expenseCategories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={expenseData.amount}
            onChange={(e) => setExpenseData((p) => ({ ...p, amount: e.target.value }))}
          />
        </div>
      </div>

      {/* Row 2: Currency & Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <Select value={expenseData.currency} onValueChange={(val) => setExpenseData((p) => ({ ...p, currency: val }))}>
            <SelectTrigger>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <Input
            type="date"
            value={expenseData.date}
            onChange={(e) => setExpenseData((p) => ({ ...p, date: e.target.value }))}
          />
        </div>
      </div>

      {/* Row 3: Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Enter details"
          value={expenseData.description}
          onChange={(e) => setExpenseData((p) => ({ ...p, description: e.target.value }))}
        />
      </div>

      {/* Row 4: Attachment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Receipt (optional)</label>
        <Input type="file" accept="image/*,.pdf" onChange={handleFileChange} />
        {receiptFile ? (
          <p className="text-xs text-gray-500 mt-1">Selected: {receiptFile.name}</p>
        ) : null}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
          {isSubmitting ? 'Submitting…' : 'Submit Expense'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setExpenseData({
              title: '',
              category: '',
              amount: '',
              currency: 'INR',
              date: new Date().toISOString().split('T')[0],
              description: '',
              tax_included: false,
            });
            setReceiptFile(null);
            setMessage('');
            if (typeof onCancel === 'function') onCancel();
          }}
        >
          Cancel
        </Button>
        {message ? <span className="text-sm text-gray-700">{message}</span> : null}
      </div>
    </form>
  );
};

export default NewExpenseForm;