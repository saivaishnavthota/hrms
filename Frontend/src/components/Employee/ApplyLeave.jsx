import React, { useState } from 'react';
import { Calendar, FileText, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ApplyLeave = () => {
  const [leaveData, setLeaveData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    emergencyContact: '',
    handoverNotes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const leaveTypes = [
    'Annual Leave',
    'Sick Leave',
    'Personal Leave',
    'Emergency Leave',
    'Maternity/Paternity Leave',
    'Bereavement Leave'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLeaveData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateDays = () => {
    if (leaveData.startDate && leaveData.endDate) {
      const start = new Date(leaveData.startDate);
      const end = new Date(leaveData.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setMessage('Leave application submitted successfully! You will receive a confirmation email shortly.');
      
      // Reset form after success
      setTimeout(() => {
        setLeaveData({
          leaveType: '',
          startDate: '',
          endDate: '',
          reason: '',
        });
        setMessage('');
      }, 3000);
    } catch (error) {
      setMessage('Failed to submit leave application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Send className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-card-foreground">Apply for Leave</h2>
            <p className="text-sm text-muted-foreground">Submit your leave application</p>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            message.includes('success') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.includes('success') && <CheckCircle className="h-4 w-4" />}
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Leave Type *
            </label>
            <select
              name="leaveType"
              value={leaveData.leaveType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Select leave type</option>
              {leaveTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={leaveData.startDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                End Date *
              </label>
              <input
                type="date"
                name="endDate"
                value={leaveData.endDate}
                onChange={handleInputChange}
                min={leaveData.startDate || new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {leaveData.startDate && leaveData.endDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <strong>Duration:</strong> {calculateDays()} day{calculateDays() !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              <FileText className="inline h-4 w-4 mr-1" />
              Reason for Leave *
            </label>
            <textarea
              name="reason"
              value={leaveData.reason}
              onChange={handleInputChange}
              placeholder="Please provide a detailed reason for your leave..."
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              required
            />
          </div>

         

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </div>
              ) : (
                'Submit Leave Application'
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setLeaveData({
                  leaveType: '',
                  startDate: '',
                  endDate: '',
                  reason: ''
                });
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

export default ApplyLeave;