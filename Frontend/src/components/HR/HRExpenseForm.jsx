import React, { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { toast } from 'react-toastify';
import api from '@/lib/api';

const HRExpenseForm = ({ onSuccess, onCancel }) => {
  const { user } = useUser();
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [expenseData, setExpenseData] = useState({
    employee_id: '',
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

  const expenseCategories = [
    'Travel', 'Food', 'Entertainment', 'Office Supplies', 'Software & Subscriptions',
    'Training & Education', 'Communication', 'Marketing', 'Equipment', 'Other',
  ];

  // Fetch employees for the dropdown
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('Missing authentication token');
        const response = await api.get('/users/onboarded-employees', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const employeeList = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setEmployees(employeeList);
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast.error(error.response?.data?.detail || 'Failed to load employees');
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setReceiptFile(file || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const employeeId = expenseData.employee_id;
      if (!employeeId) {
        throw new Error('Please select an employee.');
      }
      if (!expenseData.category) {
        throw new Error('Please select an expense category.');
      }
      
      const amountNum = parseFloat(expenseData.amount);
      if (Number.isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Please enter a valid amount.');
      }

      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Missing authentication token');

      const form = new FormData();
      form.append('employee_id', Number(employeeId));
      form.append('category', expenseData.category);
      form.append('amount', amountNum);
      form.append('currency', expenseData.currency);
      form.append('description', expenseData.description || '');
      form.append('expense_date', expenseData.date);
      form.append('tax_included', expenseData.tax_included ? 'true' : 'false');
      if (expenseData.tax_included) {
        form.append('cgst', parseFloat(expenseData.cgst || 0));
        form.append('sgst', parseFloat(expenseData.sgst || 0));
        form.append('discount', parseFloat(expenseData.discount || 0));
      }
      if (receiptFile) {
        form.append('files', receiptFile); // Changed from 'file' to 'files' to match backend
      }

      const response = await api.post('/expenses/submit-exp', form, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const selectedEmployee = employees.find(emp => emp.id === Number(employeeId));
      toast.success(`Expense added successfully for ${selectedEmployee?.name || 'employee'}! Reference: ${response.data.request_code || response.data.request_id}`);

      if (typeof onSuccess === 'function') {
        onSuccess(response.data);
      }

      // Reset form
      setExpenseData({
        employee_id: '',
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
    } catch (error) {
      console.error('Expense submission failed:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to add expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setExpenseData({
      employee_id: '',
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
    if (typeof onCancel === 'function') {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Employee <span className="text-red-500">*</span>
        </label>
        <Select 
          value={expenseData.employee_id} 
          onValueChange={(val) => setExpenseData((p) => ({ ...p, employee_id: val }))}
          disabled={loadingEmployees}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingEmployees ? "Loading employees..." : "Select employee"} />
          </SelectTrigger>
          <SelectContent>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id.toString()}>
                {employee.name} ({employee.email || employee.personal_email || 'No email'})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <Select 
            value={expenseData.category} 
            onValueChange={(val) => setExpenseData((p) => ({ ...p, category: val }))}
          >
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount <span className="text-red-500">*</span>
          </label>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <Select 
            value={expenseData.currency} 
            onValueChange={(val) => setExpenseData((p) => ({ ...p, currency: val }))}
          >
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Enter expense details..."
          value={expenseData.description}
          onChange={(e) => setExpenseData((p) => ({ ...p, description: e.target.value }))}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Receipt (optional)</label>
        <Input 
          type="file" 
          accept="image/*,.pdf" 
          onChange={handleFileChange} 
        />
        {receiptFile ? (
          <p className="text-xs text-gray-500 mt-1">Selected: {receiptFile.name}</p>
        ) : null}
      </div>
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
      <div className="flex items-center gap-3">
        <Button 
          type="submit" 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding Expense...' : 'Add Expense'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default HRExpenseForm;