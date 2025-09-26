import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { Calendar, ChevronDown, BarChart3, Users, FileText, DollarSign, Lock, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import Employee components
import AddAttendance from '@/components/Employee/AddAttendance';
import ApplyLeave from '@/components/Employee/ApplyLeave';
import UploadDocuments from '@/components/Employee/UploadDocuments';
import SubmitExpense from '@/components/Employee/SubmitExpense';
import SetPassword from '@/components/Employee/SetPassword';

const EmployeePage = () => {
  const location = useLocation();
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  const getPageInfo = (pathname) => {
    const routes = {
      '/employee/add-attendance': {
        title: 'Add Attendance',
        description: 'Record your daily attendance and working hours',
        content: <AddAttendance />
      },
      '/employee/apply-leave': {
        title: 'Apply Leave',
        description: 'Submit leave applications and manage your time off',
        content: <ApplyLeave />
      },
      '/employee/upload-documents': {
        title: 'Upload Documents',
        description: 'Upload and manage your personal documents',
        content: <UploadDocuments />
      },
      '/employee/submit-expense': {
        title: 'Submit Expense',
        description: 'Submit expense reports and reimbursement requests',
        content: <SubmitExpense />
      },
      '/employee/set-password': {
        title: 'Set Password',
        description: 'Update your account password and security settings',
        content: <SetPassword />
      }
    };

    return routes[pathname] || {
      title: 'Employee Dashboard',
      description: 'Manage your employee activities and personal information',
      content: null
    };
  };

  const pageInfo = getPageInfo(location.pathname);

  // Date range picker component
  const DateRangePicker = () => (
    <div className="flex items-center gap-2 bg-white rounded-lg border px-3 py-2">
      <Calendar className="h-4 w-4 text-gray-500" />
      <span className="text-sm text-gray-600">
        {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd, yyyy')}
      </span>
      <ChevronDown className="h-4 w-4 text-gray-500" />
    </div>
  );

  return (
    <div className="employee-dashboard-container">
      {pageInfo.content ? (
        <div className="employee-content">
          {pageInfo.content}
        </div>
      ) : (
        // Default dashboard content when no specific route is matched
        <div className="employee-dashboard-content">
          {/* Welcome Section */}
          <div className="employee-welcome-banner">
            <h2 className="text-xl font-semibold mb-2">Welcome to Employee Portal</h2>
            <p className="text-blue-100">
              Manage your attendance, leave requests, documents, and more from your personal dashboard.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="employee-quick-actions">
              {/* Add Attendance Card */}
              <div className="w-full bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Clock className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Add Attendance</h3>
                    <p className="text-sm text-gray-600">Record your daily attendance</p>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => window.location.href = '/employee/add-attendance'}
                >
                  Record Attendance
                </Button>
              </div>

              {/* Apply for Leave Card */}
              <div className="w-full bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Apply Leave</h3>
                    <p className="text-sm text-gray-600">Submit leave applications</p>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => window.location.href = '/employee/apply-leave'}
                >
                  Apply for Leave
                </Button>
              </div>

              {/* Upload Documents Card */}
              <div className="w-full bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Upload Documents</h3>
                    <p className="text-sm text-gray-600">Manage your documents</p>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => window.location.href = '/employee/upload-documents'}
                >
                  Upload Documents
                </Button>
              </div>

              {/* Submit Expense Card */}
              <div className="w-full bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Submit Expense</h3>
                    <p className="text-sm text-gray-600">Submit expense reports</p>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => window.location.href = '/employee/submit-expense'}
                >
                  Submit Expense
                </Button>
              </div>

              {/* Set Password Card */}
              <div className="w-full bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Lock className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Set Password</h3>
                    <p className="text-sm text-gray-600">Update account security</p>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => window.location.href = '/employee/set-password'}
                >
                  Change Password
                </Button>
              </div>

              {/* Stats Card */}
              <div className="w-full bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">My Statistics</h3>
                    <p className="text-sm text-gray-600">View your activity stats</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">This Month Attendance</span>
                    <span className="font-medium">22/23 days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Leave Balance</span>
                    <span className="font-medium">8 days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pending Expenses</span>
                    <span className="font-medium">$245.50</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="employee-recent-activity">
              <div className="p-6 border-b">
                <h3 className="font-semibold text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Clock className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Attendance recorded</p>
                      <p className="text-xs text-gray-600">Today at 9:00 AM</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Leave application submitted</p>
                      <p className="text-xs text-gray-600">Yesterday at 2:30 PM</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-orange-100 rounded-full">
                      <DollarSign className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Expense report approved</p>
                      <p className="text-xs text-gray-600">2 days ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default EmployeePage;