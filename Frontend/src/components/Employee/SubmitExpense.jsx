import React, { useState } from 'react';
import { Receipt, DollarSign, Calendar, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SubmitExpense = () => {
  const [expenseData, setExpenseData] = useState({
    title: '',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const [receipts, setReceipts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const expenseCategories = [
    'Travel',
    'Meals & Entertainment',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setMessage('Expense submitted successfully! You will receive a confirmation email and can track the approval status.');
      
      // Reset form after success
      setTimeout(() => {
        setExpenseData({
          title: '',
          category: '',
          amount: '',
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
      }, 3000);
    } catch (error) {
      setMessage('Failed to submit expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                Expense Title *
              </label>
              <input
                type="text"
                name="title"
                value={expenseData.title}
                onChange={handleInputChange}
                placeholder="Brief description of the expense"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                <DollarSign className="inline h-4 w-4 mr-1" />
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

          

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
             Description
            </label>
            <textarea
              name="description"
              value={expenseData.description}
              onChange={handleInputChange}
              placeholder="Any additional details about the expense..."
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              <Upload className="inline h-4 w-4 mr-1" />
              Upload Receipts
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
                  title: '',
                  category: '',
                  amount: '',
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
      </div>
    </div>
  );
};

export default SubmitExpense;