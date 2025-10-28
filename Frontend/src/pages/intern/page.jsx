import React, { useState, useEffect, useMemo } from 'react';
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

// Import Employee components (interns use the same components)
import AddAttendance from '@/components/Employee/AddAttendance';
import ApplyLeave from '@/components/Employee/ApplyLeave';
import TimeManagement from '@/components/Employee/TimeManagement';
import UploadDocuments from '@/components/Employee/UploadDocuments';
import SubmitExpense from '@/components/Employee/SubmitExpense';
import SetPassword from '@/components/Employee/SetPassword';
import { useUser } from '@/contexts/UserContext';
import api, { leaveAPI } from '@/lib/api';

const InternPage = () => {
  const location = useLocation();
  const { user } = useUser();
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  const getPageInfo = (pathname) => {
    const routes = {
      '/intern/time-management': {
        title: 'Time Management',
        description: 'Manage your attendance and leave applications',
        content: <TimeManagement />
      },
      '/intern/upload-documents': {
        title: 'Upload Documents',
        description: 'Upload and manage your personal documents',
        content: <UploadDocuments />
      },
      '/intern/submit-expense': {
        title: 'Submit Expense',
        description: 'Submit expense reports and reimbursement requests',
        content: <SubmitExpense />
      },
      '/intern/set-password': {
        title: 'Set Password',
        description: 'Update your account password and security settings',
        content: <SetPassword />
      }
    };

    return routes[pathname] || {
      title: 'Intern Dashboard',
      description: 'Manage your internship activities and personal information',
      content: null
    };
  };

  const pageInfo = getPageInfo(location.pathname);

  // Dashboard analytics state (backend-driven)
  const [attendanceWeekly, setAttendanceWeekly] = useState([]);
  const [leavesData, setLeavesData] = useState([]);
  const leavesColors = useMemo(() => ['#3b82f6', '#22c55e', '#f59e0b'], []); // blue, green, amber
  const [appliedLeavesCount, setAppliedLeavesCount] = useState(0);
  const [documentsStatus, setDocumentsStatus] = useState({ completed: 0, required: 0 });
  const documentsPercent = useMemo(() => {
    const { completed, required } = documentsStatus;
    if (!required) return 0;
    return Math.round((completed / required) * 100);
  }, [documentsStatus]);

  // Helpers
  const formatDateLocal = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getWeekStartMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay(); // 0=Sun, 1=Mon, ...
    const diffToMonday = (day + 6) % 7; // Sun->6, Mon->0, ...
    const monday = new Date(date);
    monday.setDate(date.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const dayLabel = (d) => d.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue, ...

  // Fetchers
  const fetchWeeklyAttendance = async () => {
    try {
      if (!user?.employeeId) return;
      const response = await api.get('/attendance/weekly', {
        params: { employee_id: user.employeeId }
      });
      const data = response?.data || {};

      // Build a 7-day series for current week (Mon-Sun)
      const monday = getWeekStartMonday(new Date());
      const series = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const key = formatDateLocal(d);
        const rec = data[key] || {};
        const hours = Number(rec.hours || 0);
        return { day: dayLabel(d), hours };
      });
      setAttendanceWeekly(series);
    } catch (err) {
      // Fallback sample data on error
      setAttendanceWeekly([
        { day: 'Mon', hours: 0 },
        { day: 'Tue', hours: 0 },
        { day: 'Wed', hours: 0 },
        { day: 'Thu', hours: 0 },
        { day: 'Fri', hours: 0 },
        { day: 'Sat', hours: 0 },
        { day: 'Sun', hours: 0 },
      ]);
    }
  };

  const fetchLeavesStats = async () => {
    try {
      if (!user?.employeeId) return;
      const list = await leaveAPI.getEmployeeLeaves(user.employeeId);
      const items = Array.isArray(list) ? list : (list?.data || list?.items || []);
      let sick = 0, casual = 0, annual = 0;
      for (const lv of items) {
        const t = String(lv?.leave_type || lv?.type || lv?.category || '').toLowerCase();
        if (t.includes('sick')) sick += 1;
        else if (t.includes('casual')) casual += 1;
        else if (t.includes('annual') || t.includes('earned') || t.includes('vacation')) annual += 1;
      }

      setLeavesData([
        { name: 'Sick', value: sick },
        { name: 'Casual', value: casual },
        { name: 'Annual', value: annual },
      ]);
      setAppliedLeavesCount(items?.length || 0);
    } catch (err) {
      setLeavesData([
        { name: 'Sick', value: 0 },
        { name: 'Casual', value: 0 },
        { name: 'Annual', value: 0 },
      ]);
      setAppliedLeavesCount(0);
    }
  };

  const fetchDocumentsStatus = async () => {
    try {
      if (!user?.employeeId) return;
      const resp = await api.get(`/documents/emp/${user.employeeId}`);
      const uploadedDocs = resp?.data || [];
      
      // Total required documents (matching the documentTypes array in UploadDocuments.jsx)
      const required = 16;
      // Completed documents are those that have been uploaded
      const completed = Array.isArray(uploadedDocs) ? uploadedDocs.length : 0;
      
      setDocumentsStatus({ completed, required });
    } catch (err) {
      setDocumentsStatus({ completed: 0, required: 16 });
    }
  };

  // Fetch backend data only for dashboard view
  useEffect(() => {
    if (!pageInfo.content) {
      fetchWeeklyAttendance();
      fetchLeavesStats();
      fetchDocumentsStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageInfo.content, user?.employeeId]);

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
    <div className="intern-dashboard-container">
      {pageInfo.content ? (
        <div className="intern-content">
          {pageInfo.content}
        </div>
      ) : (
        // Default dashboard content when no specific route is matched
        <div className="intern-dashboard-content">
          {/* Welcome Section */}
          <div className="intern-welcome-banner">
            
            <p className="text-blue-500 ml-4 mb-4">Overview of your weekly attendance, leaves, and documents.</p>
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
                <span className="text-sm text-gray-600">Applied: {appliedLeavesCount}</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={leavesData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} label>
                      {(leavesData || []).map((entry, index) => (
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

          {/* Recent Activity removed as requested */}
        </div>
      )}
    </div>
  );
};

export default InternPage;

