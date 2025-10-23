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
    cgst: 0,
    sgst: 0,
    discount: 0,
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
      
      // Validate that receipt is uploaded
      if (!receiptFile) {
        throw new Error('Receipt submission is mandatory. Please upload a receipt.');
      }

      const form = new FormData();
      form.append('employee_id', Number(employeeId));
      form.append('category', expenseData.category || 'Other');
      form.append('amount', amountNum);
      form.append('currency', expenseData.currency || 'INR');
      form.append('description', expenseData.description || expenseData.title || '');
      form.append('expense_date', expenseData.date);
      form.append('tax_included', expenseData.tax_included);
      if (expenseData.tax_included) {
        form.append('cgst', parseFloat(expenseData.cgst || 0));
        form.append('sgst', parseFloat(expenseData.sgst || 0));
        form.append('discount', parseFloat(expenseData.discount || 0));
      }
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
        cgst: 0,
        sgst: 0,
        discount: 0,
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

      {/* Row 4: Tax Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="tax_included"
          checked={expenseData.tax_included}
          onChange={(e) => setExpenseData((p) => ({ ...p, tax_included: e.target.checked }))}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="tax_included" className="ml-2 block text-sm text-gray-700">
          Include tax & discount calculations
        </label>
      </div>

      {/* Row 5: Tax and Discount Fields (conditional) */}
      {expenseData.tax_included && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-4">
          <h4 className="text-sm font-semibold text-blue-900">Tax & Discount Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0.00"
                value={expenseData.discount}
                onChange={(e) => setExpenseData((p) => ({ ...p, discount: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CGST (%)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0.00"
                value={expenseData.cgst}
                onChange={(e) => setExpenseData((p) => ({ ...p, cgst: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SGST (%)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0.00"
                value={expenseData.sgst}
                onChange={(e) => setExpenseData((p) => ({ ...p, sgst: e.target.value }))}
              />
            </div>
          </div>
        </div>
      )}

      {/* Row 6: Attachment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Receipt <span className="text-red-500">*</span>
        </label>
        <Input type="file" accept="image/*,.pdf" onChange={handleFileChange} required />
        {receiptFile ? (
          <p className="text-xs text-green-600 mt-1">Selected: {receiptFile.name}</p>
        ) : (
          <p className="text-xs text-red-500 mt-1">Receipt is required (Max: 70 KB per file)</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button 
          type="submit" 
          disabled={isSubmitting || !receiptFile}
          className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
        >
          {isSubmitting ? 'Submitting…' : !receiptFile ? 'Upload Receipt to Submit' : 'Submit Expense'}
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
              cgst: 0,
              sgst: 0,
              discount: 0,
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