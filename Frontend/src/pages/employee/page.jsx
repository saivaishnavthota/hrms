import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Calendar, ChevronDown, Clock, DollarSign } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

// Import Employee components
import AddAttendance from '@/components/Employee/AddAttendance';
import ApplyLeave from '@/components/Employee/ApplyLeave';
import UploadDocuments from '@/components/Employee/UploadDocuments';
import SubmitExpense from '@/components/Employee/SubmitExpense';
import SetPassword from '@/components/Employee/SetPassword';
import { useUser } from '@/contexts/UserContext';

const EmployeePage = () => {
  const location = useLocation();
  const { user } = useUser();
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

  // Dashboard analytics sample data (replace with API data later)
  const attendanceWeekly = [
    { day: 'Mon', hours: 8 },
    { day: 'Tue', hours: 7.5 },
    { day: 'Wed', hours: 8 },
    { day: 'Thu', hours: 8 },
    { day: 'Fri', hours: 7 },
    { day: 'Sat', hours: 6 },
    { day: 'Sun', hours: 0 },
  ];

  const leavesData = [
    { name: 'Used', value: 6 },
    { name: 'Remaining', value: 14 },
  ];
  const leavesColors = ['#3b82f6', '#22c55e'];

  const documentsStatus = { completed: 8, required: 10 };
  const documentsPercent = Math.round((documentsStatus.completed / documentsStatus.required) * 100);

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
            <h2 className="text-xl font-semibold mb-2">
              {`Welcome to Employee Portal - ${user?.name || ''}`}
            </h2>
            <p className="text-blue-100">Overview of your weekly attendance, leaves, and documents.</p>
          </div>

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Attendance Chart */}
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Weekly Attendance</h3>
                <DateRangePicker />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceWeekly} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis domain={[0, 8]} tickFormatter={(v) => `${v}h`} />
                    <Tooltip formatter={(v) => `${v} hrs`} />
                    <Legend />
                    <Line type="monotone" dataKey="hours" name="Hours" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Leaves Chart */}
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Leaves</h3>
                <span className="text-sm text-gray-600">Balance: {leavesData[1].value} days</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={leavesData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} label>
                      {leavesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={leavesColors[index % leavesColors.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Documents Status */}
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Documents Status</h3>
                <span className="text-sm text-gray-600">{documentsStatus.completed}/{documentsStatus.required} completed</span>
              </div>
              <div className="space-y-3">
                <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-3 bg-indigo-600 rounded-full" style={{ width: `${documentsPercent}%` }} />
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Completion</span>
                  <span className="font-medium text-gray-900">{documentsPercent}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="employee-recent-activity mt-6">
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