
import React, { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  Users, 
  Building, 
  TrendingUp, 
  Calendar, 
  RefreshCw, 
  Clock, 
  Briefcase, 
  UserCheck, 
  BarChart3, 
  PieChart as PieChartIcon,
  Shield
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [attMonthCounts, setAttMonthCounts] = useState({ present: 0, wfh: 0, leave: 0, total: 0 });
  const [attTodayCounts, setAttTodayCounts] = useState({ present: 0, wfh: 0, leave: 0, date: null });
  const [employeeTypeCounts, setEmployeeTypeCounts] = useState({ fullTime: 0, contract: 0, intern: 0, total: 0 });
  const [leaveCounts, setLeaveCounts] = useState({ approved: 0, pending: 0, rejected: 0, total: 0 });
  const [expenseCounts, setExpenseCounts] = useState({ pendingHr: 0, approved: 0, rejected: 0, carried: 0, total: 0 });
  const [attTrendData, setAttTrendData] = useState([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  const fetchAdminMetrics = useCallback(async () => {
    setIsLoadingMetrics(true);
    try {
      // Fetch ALL attendance data using admin route
      try {
        const res = await api.get('/attendance/admin/all-attendance', {
          params: { year, month },
        });
        const records = Array.isArray(res.data) ? res.data : [];
        
        let present = 0, wfh = 0, leave = 0;
        const byDate = {};
        let latestDate = null;
        
        records.forEach((r) => {
          const s = String(r.status || '').toLowerCase();
          const d = r.date || null;
          
          if (s === 'present') present += 1;
          else if (s === 'wfh') wfh += 1;
          else if (s === 'leave') leave += 1;
          
          if (d) {
            if (!latestDate || String(d) > String(latestDate)) latestDate = d;
            byDate[d] = byDate[d] || { present: 0, wfh: 0, leave: 0 };
            if (s === 'present') byDate[d].present += 1;
            else if (s === 'wfh') byDate[d].wfh += 1;
            else if (s === 'leave') byDate[d].leave += 1;
          }
        });
        
        const total = present + wfh + leave;
        setAttMonthCounts({ present, wfh, leave, total });
        
        const td = byDate[latestDate] || { present: 0, wfh: 0, leave: 0 };
        setAttTodayCounts({ present: td.present, wfh: td.wfh, leave: td.leave, date: latestDate });
        
        // Build last 7 days trend
        const sortedDates = Object.keys(byDate).sort((a, b) => (String(a) < String(b) ? -1 : 1));
        const last7 = sortedDates.slice(Math.max(0, sortedDates.length - 7));
        const trend = last7.map((d) => ({
          label: d,
          present: byDate[d].present || 0,
          wfh: byDate[d].wfh || 0,
          leave: byDate[d].leave || 0,
        }));
        setAttTrendData(trend);
      } catch (err) {
        console.error('Error fetching attendance:', err);
      }

      // Fetch ALL leave requests using admin route
      try {
        const resLeaves = await api.get('/leave/admin/all-leave-requests');
        const items = Array.isArray(resLeaves.data) ? resLeaves.data : [];
        
        let approved = 0, pending = 0, rejected = 0;
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59);
        
        items.forEach((lv) => {
          const leaveStart = new Date(lv.start_date);
          const leaveEnd = new Date(lv.end_date);
          
          if ((leaveStart >= start && leaveStart <= end) || (leaveEnd >= start && leaveEnd <= end)) {
            const status = String(lv.hr_status || '').toLowerCase();
            if (status.includes('approved')) approved += 1;
            else if (status.includes('rejected')) rejected += 1;
            else if (status.includes('pending')) pending += 1;
          }
        });
        
        setLeaveCounts({ approved, pending, rejected, total: approved + pending + rejected });
      } catch (err) {
        console.error('Error fetching leaves:', err);
      }

      // Fetch ALL employees
      try {
        const resEmp = await api.get('/users/employees');
        const listRaw = Array.isArray(resEmp.data?.employees)
          ? resEmp.data.employees
          : Array.isArray(resEmp.data) ? resEmp.data : [];
        
        let full = 0, contract = 0, intern = 0;
        listRaw.forEach((emp) => {
          const role = String(emp.role || '').toLowerCase().trim();
          const empTypeRaw = emp.type || emp.employment_type || emp.employmentType || emp.emp_type || '';
          const empType = String(empTypeRaw).toLowerCase().replace('-', '_').trim();
          
          if (role === 'intern' || empType.includes('intern')) {
            intern += 1;
          } else if (empType.includes('full_time') || empType.includes('fulltime') || empType.includes('permanent') || empType.includes('full')) {
            full += 1;
          } else if (empType.includes('contract')) {
            contract += 1;
          }
        });
        
        const tot = full + contract + intern;
        setEmployeeTypeCounts({ fullTime: full, contract, intern, total: tot });
        setTotalEmployees(listRaw.length);
      } catch (err) {
        console.error('Error fetching employees:', err);
      }

      // Fetch ALL expenses using admin route
      try {
        const resExp = await api.get('/expenses/admin/all-expense-requests');
        const items = Array.isArray(resExp.data) ? resExp.data : [];
        
        let pendingHr = 0, approved = 0, rejected = 0, carried = 0;
        for (const it of items) {
          const s = String(it.status || '').toLowerCase();
          if (s === 'pending_hr_approval') pendingHr += 1;
          else if (s === 'approved') approved += 1;
          else if (s === 'hr_rejected') rejected += 1;
          else if (s === 'carried_forward') carried += 1;
        }
        setExpenseCounts({ pendingHr, approved, rejected, carried, total: items.length });
      } catch (err) {
        console.error('Error fetching expenses:', err);
      }
    } catch (err) {
      toast.error('Failed to load metrics');
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchAdminMetrics();
  }, [fetchAdminMetrics]);

  // Employee Performance Chart
  const EmployeePerformanceChart = () => {
    const present = attMonthCounts.present || 0;
    const wfh = attMonthCounts.wfh || 0;
    const leave = attMonthCounts.leave || 0;
    const yStep = 2;
    const maxCount = Math.max(present, wfh, leave);
    const topScale = Math.max(yStep, Math.ceil(maxCount / yStep) * yStep);
    const ticks = Array.from({ length: topScale / yStep + 1 }, (_, i) => i * yStep);

    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            Employee Attendance
          </h3>
          <span className="text-xs text-gray-500">Current month</span>
        </div>
        <div className="h-64">
          <div className="flex items-end h-full px-4 pb-8">
            <div className="flex flex-col justify-between items-end pr-3 w-10 h-full text-[10px] text-gray-500">
              {ticks.slice().reverse().map((t) => (
                <div key={t} className="flex items-center gap-1 w-full">
                  <span>{t}</span>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>
              ))}
            </div>
            <div className="flex items-end gap-6 h-full w-full">
              {maxCount === 0 && (
                <div className="relative inset-x-0 bottom-10 flex items-center justify-center text-gray-500 text-sm">No attendance data</div>
              )}
              <div className="flex flex-col items-center gap-2 flex-1 h-full">
                <span className="text-xs font-medium text-gray-800">{present}</span>
                <div className="w-8 h-full flex items-end">
                  <div className="w-full bg-blue-500 rounded-t shadow-sm border border-blue-400" style={{ height: `${topScale ? Math.round((present / topScale) * 100) : 0}%` }}></div>
                </div>
                <span className="text-xs text-gray-600">Present</span>
              </div>
              <div className="flex flex-col items-center gap-2 flex-1 h-full">
                <span className="text-xs font-medium text-gray-800">{wfh}</span>
                <div className="w-8 h-full flex items-end">
                  <div className="w-full bg-green-500 rounded-t shadow-sm border border-green-400" style={{ height: `${topScale ? Math.round((wfh / topScale) * 100) : 0}%` }}></div>
                </div>
                <span className="text-xs text-gray-600">WFH</span>
              </div>
              <div className="flex flex-col items-center gap-2 flex-1 h-full">
                <span className="text-xs font-medium text-gray-800">{leave}</span>
                <div className="w-8 h-full flex items-end">
                  <div className="w-full bg-yellow-500 rounded-t shadow-sm border border-yellow-400" style={{ height: `${topScale ? Math.round((leave / topScale) * 100) : 0}%` }}></div>
                </div>
                <span className="text-xs text-gray-600">Leave</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Employee Type Pie Chart
  const EmployeeTypeChart = () => (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-3 mr-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <PieChartIcon className="h-4 w-4 text-green-500" />
          Employee Types
        </h3>
        <span className="text-xs text-gray-500">{employeeTypeCounts.total || 0} total</span>
      </div>
      <div className="flex items-center justify-center h-64">
        <div className="relative w-64 h-64">
          {!employeeTypeCounts.total && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">No data</div>
          )}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="25"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="12"
              strokeDasharray={`${Math.round(2 * Math.PI * 35 * ((employeeTypeCounts.total ? employeeTypeCounts.fullTime / employeeTypeCounts.total : 0)))} ${Math.max(0, Math.round(2 * Math.PI * 35 - (2 * Math.PI * 35 * ((employeeTypeCounts.total ? employeeTypeCounts.fullTime / employeeTypeCounts.total : 0)))))}`}
              strokeDashoffset="0"
            />
            <circle
              cx="50"
              cy="50"
              r="25"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="12"
              strokeDasharray={`${Math.round(2 * Math.PI * 35 * ((employeeTypeCounts.total ? employeeTypeCounts.contract / employeeTypeCounts.total : 0)))} ${Math.max(0, Math.round(2 * Math.PI * 35 - (2 * Math.PI * 35 * ((employeeTypeCounts.total ? employeeTypeCounts.contract / employeeTypeCounts.total : 0)))))}`}
              strokeDashoffset={`-${Math.round(2 * Math.PI * 35 * ((employeeTypeCounts.total ? employeeTypeCounts.fullTime / employeeTypeCounts.total : 0)))}`}
            />
            <circle
              cx="50"
              cy="50"
              r="25"
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="12"
              strokeDasharray={`${Math.round(2 * Math.PI * 35 * ((employeeTypeCounts.total ? employeeTypeCounts.intern / employeeTypeCounts.total : 0)))} ${Math.max(0, Math.round(2 * Math.PI * 35 - (2 * Math.PI * 35 * ((employeeTypeCounts.total ? employeeTypeCounts.intern / employeeTypeCounts.total : 0)))))}`}
              strokeDashoffset={`-${Math.round(2 * Math.PI * 35 * ((employeeTypeCounts.total ? (employeeTypeCounts.fullTime + employeeTypeCounts.contract) / employeeTypeCounts.total : 0)))}`}
            />
          </svg>
          <div className="absolute -right-13 top-0 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Full-time ({employeeTypeCounts.total ? Math.round((employeeTypeCounts.fullTime / employeeTypeCounts.total) * 100) : 0}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Contract ({employeeTypeCounts.total ? Math.round((employeeTypeCounts.contract / employeeTypeCounts.total) * 100) : 0}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span>Intern ({employeeTypeCounts.total ? Math.round((employeeTypeCounts.intern / employeeTypeCounts.total) * 100) : 0}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Attendance Trend Line Chart
  const AttendanceTrendChart = () => (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-purple-500" />
          Attendance Trend
        </h3>
        <span className="text-xs text-gray-500">Last 7 days</span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={attTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="present" stroke="#10b981" name="Present" />
            <Line type="monotone" dataKey="wfh" stroke="#3b82f6" name="WFH" />
            <Line type="monotone" dataKey="leave" stroke="#ef4444" name="Leave" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // Leave Requests Chart
  const LeaveRequestsChart = () => (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-orange-500" />
          Leave Requests
        </h3>
        <span className="text-xs text-gray-500">This month</span>
      </div>
      <div className="h-64">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Approved</span>
            <span className="text-sm text-gray-500">{leaveCounts.approved || 0}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-green-500 h-3 rounded-full" style={{width: `${leaveCounts.total ? (leaveCounts.approved / leaveCounts.total) * 100 : 0}%`}}></div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Pending</span>
            <span className="text-sm text-gray-500">{leaveCounts.pending || 0}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-yellow-500 h-3 rounded-full" style={{width: `${leaveCounts.total ? (leaveCounts.pending / leaveCounts.total) * 100 : 0}%`}}></div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Rejected</span>
            <span className="text-sm text-gray-500">{leaveCounts.rejected || 0}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-red-500 h-3 rounded-full" style={{width: `${leaveCounts.total ? (leaveCounts.rejected / leaveCounts.total) * 100 : 0}%`}}></div>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{leaveCounts.total || 0}</div>
            <div className="text-sm text-gray-500">Total Requests</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="px-3 py-1.5 border rounded-md bg-white text-sm">
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, idx) => (
              <option key={m} value={idx+1}>{m}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="px-3 py-1.5 border rounded-md bg-white text-sm">
            {Array.from({ length: 5 }).map((_, i) => {
              const y = new Date().getFullYear() - 2 + i;
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
          <button onClick={fetchAdminMetrics} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Row 1: Statistical Data Cards + First Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        {/* Statistical Cards - 3 columns */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{isLoadingMetrics ? '…' : totalEmployees}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">WFH Rate</p>
                <p className="text-2xl font-bold text-gray-900">{attMonthCounts.total ? Math.round((attMonthCounts.wfh / attMonthCounts.total) * 100) : 0}%</p>
                <p className="text-xs text-green-500 mt-0.5">{attTodayCounts.wfh || 0} today</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Present Rate</p>
                <p className="text-2xl font-bold text-gray-900">{attMonthCounts.total ? Math.round((attMonthCounts.present / attMonthCounts.total) * 100) : 0}%</p>
                <p className="text-xs text-green-500 mt-0.5">{attTodayCounts.present || 0} today</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Pending Leaves</p>
                <p className="text-2xl font-bold text-gray-900">{leaveCounts.pending || 0}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">On Leave</p>
                <p className="text-2xl font-bold text-gray-900">{attTodayCounts.leave || 0}</p>
                <p className="text-xs text-red-600 mt-0.5">Today</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Pending Expenses</p>
                <p className="text-2xl font-bold text-gray-900">{expenseCounts.pendingHr || 0}</p>
                <p className="text-xs text-red-600 mt-0.5">+{expenseCounts.total || 0} total</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* First Two Charts Side by Side */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
          <EmployeePerformanceChart />
          <EmployeeTypeChart />
        </div>
      </div>

      {/* Row 2: Remaining Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AttendanceTrendChart />
        <LeaveRequestsChart />
      </div>
    </div>
  );
};

export default AdminDashboard;
