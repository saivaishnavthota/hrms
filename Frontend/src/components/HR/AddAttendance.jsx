import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Building, Save, X, Plus } from 'lucide-react';

const AddAttendance = () => {
  const [formData, setFormData] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    action: 'Present',
    hours: 8,
    project: ''
  });

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Mock employee data
  useEffect(() => {
    setEmployees([
      { id: 1, name: 'John Doe', email: 'john.doe@company.com', department: 'Engineering', role: 'Senior Developer' },
      { id: 2, name: 'Jane Smith', email: 'jane.smith@company.com', department: 'Marketing', role: 'Marketing Manager' },
      { id: 3, name: 'Mike Johnson', email: 'mike.johnson@company.com', department: 'Sales', role: 'Sales Executive' },
      { id: 4, name: 'Sarah Wilson', email: 'sarah.wilson@company.com', department: 'HR', role: 'HR Specialist' },
      { id: 5, name: 'David Brown', email: 'david.brown@company.com', department: 'Finance', role: 'Financial Analyst' }
    ]);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Mock API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ 
        type: 'success', 
        text: 'Attendance record added successfully!' 
      });
      
      // Reset form
      setFormData({
        employee_id: '',
        date: new Date().toISOString().split('T')[0],
        action: 'Present',
        hours: 8,
        project: ''
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to add attendance record. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      employee_id: '',
      date: new Date().toISOString().split('T')[0],
      action: 'Present',
      hours: 8,
      project: ''
    });
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Attendance</h1>
          <p className="text-gray-600">Record employee attendance for the selected date</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline w-4 h-4 mr-1" />
                  Employee
                </label>
                <select
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Employee</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.department}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Action and Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="action"
                  value={formData.action}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Present">Present</option>
                  <option value="WFH">Work From Home</option>
                  <option value="Leave">Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline w-4 h-4 mr-1" />
                  Hours Worked
                </label>
                <input
                  type="number"
                  name="hours"
                  value={formData.hours}
                  onChange={handleInputChange}
                  min="0"
                  max="24"
                  step="0.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Project */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="inline w-4 h-4 mr-1" />
                Project (Optional)
              </label>
              <input
                type="text"
                name="project"
                value={formData.project}
                onChange={handleInputChange}
                placeholder="Enter project name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Message Display */}
            {message.text && (
              <div className={`p-4 rounded-md ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Attendance'}
              </button>
              
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <X className="w-4 h-4" />
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Instructions Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Instructions:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Select the employee from the dropdown list</li>
            <li>• Choose the appropriate date for the attendance record</li>
            <li>• Select the status: Present, Work From Home, or Leave</li>
            <li>• Enter the number of hours worked (if applicable)</li>
            <li>• Optionally specify the project the employee worked on</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddAttendance;