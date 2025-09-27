import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Users, Building, TrendingUp, Calendar, RefreshCw, Clock, Briefcase, UserCheck, BarChart3 } from 'lucide-react';
import { userAPI } from '../../lib/api';

const Dashboard = () => {
  const [totalEmployees, setTotalEmployees] = useState(null);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [employeeError, setEmployeeError] = useState(null);

  const fetchTotalEmployees = async () => {
    setIsLoadingEmployees(true);
    setEmployeeError(null);
    try {
      const count = await userAPI.getOnboardedEmployeesCount();
      if (count !== null && count !== undefined) {
        setTotalEmployees(count);
      } else {
        // Fallback: use /users/employees and take length if count missing
        const employees = await userAPI.getEmployees();
        setTotalEmployees(Array.isArray(employees) ? employees.length : null);
      }
    } catch (err) {
      setEmployeeError('Failed to load employees');
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchTotalEmployees();
  }, []);
  // Employee Performance Chart
  const EmployeePerformanceChart = () => (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Employee Attendance 
        </h3>
        <span className="text-sm text-gray-500">Last 1 month</span>
      </div>
      <div className="h-80">
        <div className="flex items-end justify-between h-full px-4 pb-8">
          {/* Bar Chart */}
          <div className="flex items-end gap-4 h-full w-full">
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-8 h-32 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t"></div>
              <span className="text-xs text-gray-600">Present</span>
            </div>
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-8 h-40 bg-gradient-to-t from-green-500 to-green-300 rounded-t"></div>
              <span className="text-xs text-gray-600">WFH</span>
            </div>
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-8 h-36 bg-gradient-to-t from-yellow-500 to-yellow-300 rounded-t"></div>
              <span className="text-xs text-gray-600">Leave</span>
            </div>

            
          </div>
        </div>
      </div>
    </div>
  );

  // Employee Type Pie Chart
  const EmployeeTypeChart = () => (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-5 mr-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <PieChart className="h-5 w-5 text-green-500" />
          Type of the Employee
        </h3>
        <span className="text-sm text-gray-500"> 150 employees</span>
      </div>
      <div className="flex items-center justify-center h-80">
        <div className="relative w-64 h-64">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Full-time - 60% */}
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="12"
              strokeDasharray="132 88"
              strokeDashoffset="0"
            />
            {/* Contract - 30% */}
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="12"
              strokeDasharray="66 154"
              strokeDashoffset="-132"
            />
            {/* Intern - 10% */}
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="12"
              strokeDasharray="22 198"
              strokeDashoffset="-198"
            />
          </svg>
          {/* Legend */}
          <div className="absolute -right-25 top-0 space-y-2 text-sm ">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Full-time (60%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Contract (30%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span>Intern (10%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Attendance Trend Line Chart
  const AttendanceTrendChart = () => (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-500" />
          Attendance Trend
        </h3>
        <span className="text-sm text-gray-500">Weekly average</span>
      </div>
      <div className="h-80 relative">
        <svg className="w-full h-full" viewBox="0 0 400 200">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Line chart */}
          <polyline
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="3"
            points="20,160 60,140 100,120 140,100 180,90 220,85 260,80 300,75 340,70 380,65"
          />
          
          {/* Data points */}
          <circle cx="20" cy="160" r="4" fill="#8b5cf6" />
          <circle cx="60" cy="140" r="4" fill="#8b5cf6" />
          <circle cx="100" cy="120" r="4" fill="#8b5cf6" />
          <circle cx="140" cy="100" r="4" fill="#8b5cf6" />
          <circle cx="180" cy="90" r="4" fill="#8b5cf6" />
          <circle cx="220" cy="85" r="4" fill="#8b5cf6" />
          <circle cx="260" cy="80" r="4" fill="#8b5cf6" />
          <circle cx="300" cy="75" r="4" fill="#8b5cf6" />
          <circle cx="340" cy="70" r="4" fill="#8b5cf6" />
          <circle cx="380" cy="65" r="4" fill="#8b5cf6" />
        </svg>
        
        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 px-4">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>
      </div>
    </div>
  );

  // Leave Requests Chart
  const LeaveRequestsChart = () => (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-orange-500" />
          Leave Requests
        </h3>
        <span className="text-sm text-gray-500">This month</span>
      </div>
      <div className="h-80">
        <div className="space-y-4">
          {/* Approved Leaves */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Approved</span>
            <span className="text-sm text-gray-500">24</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-green-500 h-3 rounded-full" style={{width: '60%'}}></div>
          </div>
          
          {/* Pending Leaves */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Pending</span>
            <span className="text-sm text-gray-500">8</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-yellow-500 h-3 rounded-full" style={{width: '20%'}}></div>
          </div>
          
          {/* Rejected Leaves */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Rejected</span>
            <span className="text-sm text-gray-500">3</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-red-500 h-3 rounded-full" style={{width: '7.5%'}}></div>
          </div>
        </div>
        
        {/* Summary */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">40</div>
            <div className="text-sm text-gray-500">Total Requests</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">HR Dashboard</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Statistical Data Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Employees */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Employees</p>
              <p className="text-3xl font-bold text-gray-900">
                {isLoadingEmployees ? '…' : totalEmployees ?? '—'}
              </p>
              <p className="text-sm text-green-600 mt-1">+10 this month</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Attendance rate ( work from home today ) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Attendance rate</p>
              <p className="text-3xl font-bold text-gray-900">0%</p>
              <p className="text-sm text-green-500 mt-1"> 2 work from home today</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Attendance Rate</p>
              <p className="text-3xl font-bold text-gray-900">0%</p>
              <p className="text-sm text-green-500 mt-1">0 present today</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Leaves</p>
              <p className="text-3xl font-bold text-gray-900">0</p>
              <p className="text-sm text-red-500 mt-1">60 on leave today</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Attendance rate ( leave today ) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Attendance rate</p>
              <p className="text-3xl font-bold text-gray-900">6</p>
              <p className="text-sm text-red-600 mt-1">+8 Leave on today</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Pending Expenses */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Expenses</p>
              <p className="text-3xl font-bold text-gray-900">20</p>
              <p className="text-sm text-red-600 mt-1">+20 this month</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EmployeePerformanceChart />
        <EmployeeTypeChart />
        <AttendanceTrendChart />
        <LeaveRequestsChart />
      </div>
    </div>
  );
};

export default Dashboard;