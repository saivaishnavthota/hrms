import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Users, Building, TrendingUp, Calendar, RefreshCw, Clock, Briefcase, UserCheck, BarChart3 } from 'lucide-react';
import api, { userAPI } from '../../lib/api';
import { useUser } from '../../contexts/UserContext';
import useLivePoll from '../../hooks/useLivePoll';
const Dashboard = () => {
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const { user } = useUser();
  const hrId = useMemo(() => {
    return (
      user?.employeeId ||
      (() => {
        try {
          const stored = localStorage.getItem('userData');
          return stored ? JSON.parse(stored)?.employeeId : null;
        } catch (e) {
          return null;
        }
      })()
    );
  }, [user]);
  const hrName = useMemo(() => {
    try {
      return (
        user?.name || user?.fullName || user?.username ||
        JSON.parse(localStorage.getItem('userData') || '{}')?.name || null
      );
    } catch {
      return null;
    }
  }, [user]);
  const [month, setMonth] = useState(() => new Date().getMonth()+1);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [attMonthCounts, setAttMonthCounts] = useState({ present: 0, wfh: 0, leave: 0, total: 0 });
  const [attTodayCounts, setAttTodayCounts] = useState({ present: 0, wfh: 0, leave: 0, date: null });
  const [employeeTypeCounts, setEmployeeTypeCounts] = useState({ fullTime: 0, contract: 0, intern: 0, total: 0 });
  const [leaveCounts, setLeaveCounts] = useState({ approved: 0, pending: 0, rejected: 0, total: 0 });
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState(null);
  const [expenseCounts, setExpenseCounts] = useState({ pendingHr: 0, approved: 0, rejected: 0, carried: 0, total: 0 });
  const [attTrendData, setAttTrendData] = useState([]);

useEffect(() => {
    const fetchTotalEmployees = async () => {
      try {
        const res = await api.get('/users/employees');
        const listRaw = Array.isArray(res.data?.employees) ? res.data.employees : (Array.isArray(res.data) ? res.data : []);

        // Scope to employees assigned to this HR using multiple possible fields
        const matchesHr = (hrItem) => {
          const val = typeof hrItem === 'object' ? (hrItem?.id || hrItem?.employee_id || hrItem?.emp_id) : hrItem;
          return hrId ? String(val) === String(hrId) : true;
        };
        const isAssignedToHR = (emp) => {
          const hrList = emp?.hr_list || emp?.hrs || emp?.hr || [];
          if (Array.isArray(hrList) && hrId && hrList.some(matchesHr)) return true;
          if (Array.isArray(emp?.hr_ids) && hrId && emp.hr_ids.some((id) => String(id) === String(hrId))) return true;
          if (hrId && emp?.hr1_id && String(emp.hr1_id) === String(hrId)) return true;
          if (hrId && emp?.hr2_id && String(emp.hr2_id) === String(hrId)) return true;
          return !hrId; // if no hrId available, treat as all employees
        };

        const list = Array.isArray(listRaw) ? listRaw.filter(isAssignedToHR) : [];
        setTotalEmployees(list.length);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };

    fetchTotalEmployees();
  }, [hrId]);


  const fetchHRMetrics = useCallback(async () => {
    if (!hrId) return;
    setIsLoadingMetrics(true);
    setMetricsError(null);
    try {
      // Attendance monthly summary or fallback to daily
      let present = 0, wfh = 0, leave = 0, total = 0;
      let todayPresent = 0, todayWfh = 0, todayLeave = 0, latestDate = null;
      try {
        const res = await api.get('/attendance/hr-assigned', {
          params: { hr_id: hrId, year, month },
        });
        if (res.status >= 200 && res.status < 300) {
          const data = res.data;
          if (Array.isArray(data)) {
            data.forEach((item) => {
              present += Number(item.present || 0);
              wfh += Number(item.wfh || 0);
              leave += Number(item.leave || 0);
            });
            total = present + wfh + leave;
          } else if (data && data.summary) {
            present = Number(data.summary.present || 0);
            wfh = Number(data.summary.wfh || 0);
            leave = Number(data.summary.leave || 0);
            total = present + wfh + leave;
          } else {
            throw new Error('Unexpected summary shape');
          }
        } else {
          throw new Error('Attendance summary fetch failed');
        }
      } catch {
        // Fallback: hr-daily and compute both monthly and today
        try {
          const resDaily = await api.get('/attendance/hr-daily', {
            params: { hr_id: hrId, year, month },
          });
          if (resDaily.status >= 200 && resDaily.status < 300) {
            const records = Array.isArray(resDaily.data) ? resDaily.data : (Array.isArray(resDaily.data?.records) ? resDaily.data.records : []);
            const byDate = {};
            if (Array.isArray(records)) {
              records.forEach((r) => {
                const s = String(r.action || r.status || '').toLowerCase();
                const d = r.date || r.day || null;
                if (s === 'present') present += 1; else if (s === 'wfh') wfh += 1; else if (s === 'leave') leave += 1;
                if (d) {
                  if (!latestDate || String(d) > String(latestDate)) latestDate = d;
                  byDate[d] = byDate[d] || { present: 0, wfh: 0, leave: 0 };
                  if (s === 'present') byDate[d].present += 1; else if (s === 'wfh') byDate[d].wfh += 1; else if (s === 'leave') byDate[d].leave += 1;
                }
              });
              total = present + wfh + leave;
              const td = byDate[latestDate] || { present: 0, wfh: 0, leave: 0 };
              todayPresent = td.present; todayWfh = td.wfh; todayLeave = td.leave;
              // Build last 7 days trend data
              const sortedDates = Object.keys(byDate).sort((a, b) => (String(a) < String(b) ? -1 : 1));
              const last7 = sortedDates.slice(Math.max(0, sortedDates.length - 7));
              const trend = last7.map((d) => ({
                label: d,
                present: byDate[d].present || 0,
                wfh: byDate[d].wfh || 0,
                leave: byDate[d].leave || 0,
              }));
              setAttTrendData(trend);
            }
          }
        } catch (e) {
          // keep defaults
        }
      }
      // If monthly summary succeeded, still fetch hr-daily to populate trend
      if (!attTrendData || attTrendData.length === 0) {
        try {
          const resDaily2 = await api.get('/attendance/hr-daily', {
            params: { hr_id: hrId, year, month },
          });
          const records2 = Array.isArray(resDaily2.data) ? resDaily2.data : (Array.isArray(resDaily2.data?.records) ? resDaily2.data.records : []);
          const byDate2 = {};
          for (const r of records2) {
            const s = String(r.action || r.status || '').toLowerCase();
            const d = r.date || r.day || null;
            if (!d) continue;
            byDate2[d] = byDate2[d] || { present: 0, wfh: 0, leave: 0 };
            if (s === 'present') byDate2[d].present += 1; else if (s === 'wfh') byDate2[d].wfh += 1; else if (s === 'leave') byDate2[d].leave += 1;
          }
          const sorted2 = Object.keys(byDate2).sort((a, b) => (String(a) < String(b) ? -1 : 1));
          const last7_2 = sorted2.slice(Math.max(0, sorted2.length - 7));
          setAttTrendData(last7_2.map((d) => ({ label: d, present: byDate2[d].present || 0, wfh: byDate2[d].wfh || 0, leave: byDate2[d].leave || 0 })));
        } catch {}
      }
      setAttMonthCounts({ present, wfh, leave, total });
      setAttTodayCounts({ present: todayPresent, wfh: todayWfh, leave: todayLeave, date: latestDate });

    try {
  const resLeaves = await api.get(`/leave/hr/leave-requests/${hrId}`);
  if (resLeaves.status >= 200 && resLeaves.status < 300) {
    const items = Array.isArray(resLeaves.data)
      ? resLeaves.data
      : (Array.isArray(resLeaves.data?.items) ? resLeaves.data.items : []);

    let approved = 0, pending = 0, rejected = 0;

    const start = new Date(year, month - 1, 1); // first day of month
    const end = new Date(year, month, 0, 23, 59, 59); // last day of month

    if (Array.isArray(items)) {
      items.forEach((lv) => {
        // Use leave start_date for filtering
        const leaveStart = new Date(lv.start_date);
        const leaveEnd = new Date(lv.end_date);

        // check if leave falls inside the selected month range
        if ((leaveStart >= start && leaveStart <= end) || (leaveEnd >= start && leaveEnd <= end)) {
          const status = String(lv.hr_status || '').toLowerCase();
          if (status.includes('approved')) {
            approved += 1;
          } else if (status.includes('rejected')) {
            rejected += 1;
          } else if (status.includes('pending')) {
            pending += 1;
          }
        }
      });
    }

    const totalLeaves = approved + pending + rejected;
    setLeaveCounts({ approved, pending, rejected, total: totalLeaves });
  }
} catch (e) {
  console.error("Error fetching leaves:", e);
}


     try {
  const resEmp = await api.get('/users/onboarded-employees');
  const listRaw = Array.isArray(resEmp.data?.employees)
    ? resEmp.data.employees
    : (Array.isArray(resEmp.data?.data) ? resEmp.data.data : (Array.isArray(resEmp.data) ? resEmp.data : []));

  const matchesHr = (hrItem) => {
    // Support both HR id/object and HR name strings from backend
    if (typeof hrItem === 'string') {
      return hrName ? String(hrItem).toLowerCase() === String(hrName).toLowerCase() : false;
    }
    const val = typeof hrItem === 'object' ? (hrItem?.id || hrItem?.employee_id || hrItem?.emp_id) : hrItem;
    return hrId ? String(val) === String(hrId) : false;
  };

  const isAssignedToHR = (emp) => {
    const hrList = emp?.hr_list || emp?.hrs || emp?.hr || [];
    if (Array.isArray(hrList) && hrList.some(matchesHr)) return true;
    if (Array.isArray(emp?.hr_ids) && hrId && emp.hr_ids.some((id) => String(id) === String(hrId))) return true;
    if (hrId && emp?.hr1_id && String(emp.hr1_id) === String(hrId)) return true;
    if (hrId && emp?.hr2_id && String(emp.hr2_id) === String(hrId)) return true;
    // Fallback: if we cannot determine assignment, include the employee so charts aren’t empty
    return !hrId || !hrName;
  };

  const list = Array.isArray(listRaw) ? listRaw.filter(isAssignedToHR) : [];

  let full = 0, contract = 0, intern = 0;
  list.forEach((emp) => {
    const t = String(emp.type || emp.employment_type || '').toLowerCase().replace('-', '_').trim();

    if (t.includes('full_time')) {
      full += 1;
    } else if (t.includes('contract')) {
      contract += 1;
    } else if (t.includes('intern')) {
      intern += 1;
    }
  });

  const tot = full + contract + intern;
  setEmployeeTypeCounts({ fullTime: full, contract, intern, total: tot });

  // Also sync total employees for this HR
  setTotalEmployees(list.length);
} catch (e) {
  console.error("Error fetching employees:", e);
}

      // Expenses summary for HR (current month)
      try {
        const resExp = await api.get('/expenses/hr-exp-list', {
          params: { hr_id: hrId, year, month },
        });
        const items = Array.isArray(resExp.data) ? resExp.data : (Array.isArray(resExp.data?.items) ? resExp.data.items : []);
        let pendingHr = 0, approved = 0, rejected = 0, carried = 0;
        for (const it of items) {
          const s = String(it.status || '').toLowerCase();
          if (s === 'pending_hr_approval') pendingHr += 1;
          else if (s === 'approved') approved += 1;
          else if (s === 'hr_rejected') rejected += 1;
          else if (s === 'carried_forward') carried += 1;
        }
        setExpenseCounts({ pendingHr, approved, rejected, carried, total: items.length });
      } catch (e) {
        // ignore errors
      }
    } catch (err) {
      setMetricsError('Failed to load metrics');
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [hrId, month, year]);

  useEffect(() => {
    fetchHRMetrics();
  }, [fetchHRMetrics]);

  useLivePoll(fetchHRMetrics, 5000);
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
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Employee Attendance 
          </h3>
          <span className="text-sm text-gray-500">Current month</span>
        </div>
        <div className="h-96">
          <div className="flex items-end h-full px-4 pb-8">
            {/* Y Axis */}
            <div className="flex flex-col justify-between items-end pr-3 w-10 h-full text-[10px] text-gray-500">
              {ticks.slice().reverse().map((t) => (
                <div key={t} className="flex items-center gap-1 w-full">
                  <span>{t}</span>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>
              ))}
            </div>
            {/* Bars */}
              <div className="flex items-end gap-6 h-full w-full">
              {maxCount === 0 && (
                <div className="absolute inset-x-0 bottom-10 flex items-center justify-center text-gray-500 text-sm">No attendance data</div>
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
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-5 mr-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <PieChart className="h-5 w-5 text-green-500" />
          Type of the Employee
        </h3>
        <span className="text-sm text-gray-500"> {employeeTypeCounts.total || 0} employees</span>
      </div>
      <div className="flex items-center justify-center h-80">
        <div className="relative w-64 h-64">
          {!employeeTypeCounts.total && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">No data</div>
          )}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Full-time - 60% */}
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="12"
              strokeDasharray={`${Math.round(2 * Math.PI * 35 * ((employeeTypeCounts.total ? employeeTypeCounts.fullTime / employeeTypeCounts.total : 0)))} ${Math.max(0, Math.round(2 * Math.PI * 35 - (2 * Math.PI * 35 * ((employeeTypeCounts.total ? employeeTypeCounts.fullTime / employeeTypeCounts.total : 0)))))}`}
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
              strokeDasharray={`${Math.round(2 * Math.PI * 35 * ((employeeTypeCounts.total ? employeeTypeCounts.contract / employeeTypeCounts.total : 0)))} ${Math.max(0, Math.round(2 * Math.PI * 35 - (2 * Math.PI * 35 * ((employeeTypeCounts.total ? employeeTypeCounts.contract / employeeTypeCounts.total : 0)))))}`}
              strokeDashoffset={`-${Math.round(2 * Math.PI * 35 * ((employeeTypeCounts.total ? employeeTypeCounts.fullTime / employeeTypeCounts.total : 0)))}`}
            />
            {/* Intern - 10% */}
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="12"
              strokeDasharray={`${Math.round(2 * Math.PI * 35 * ((employeeTypeCounts.total ? employeeTypeCounts.intern / employeeTypeCounts.total : 0)))} ${Math.max(0, Math.round(2 * Math.PI * 35 - (2 * Math.PI * 35 * ((employeeTypeCounts.total ? employeeTypeCounts.intern / employeeTypeCounts.total : 0)))))}`}
              strokeDashoffset={`-${Math.round(2 * Math.PI * 35 * ((employeeTypeCounts.total ? (employeeTypeCounts.fullTime + employeeTypeCounts.contract) / employeeTypeCounts.total : 0)))}`}
            />
          </svg>
          {/* Legend */}
          <div className="absolute -right-20 top-0 space-y-2 text-sm ">
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
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-500" />
          Attendance Trend
        </h3>
        <span className="text-sm text-gray-500">Last 7 days</span>
      </div>
      <div className="h-80">
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
            <span className="text-sm text-gray-500">{leaveCounts.approved || 0}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-green-500 h-3 rounded-full" style={{width: `${leaveCounts.total ? (leaveCounts.approved / leaveCounts.total) * 100 : 0}%`}}></div>
          </div>
          
          {/* Pending Leaves */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Pending</span>
            <span className="text-sm text-gray-500">{leaveCounts.pending || 0}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-yellow-500 h-3 rounded-full" style={{width: `${leaveCounts.total ? (leaveCounts.pending / leaveCounts.total) * 100 : 0}%`}}></div>
          </div>
          
          {/* Rejected Leaves */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Rejected</span>
            <span className="text-sm text-gray-500">{leaveCounts.rejected || 0}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-red-500 h-3 rounded-full" style={{width: `${leaveCounts.total ? (leaveCounts.rejected / leaveCounts.total) * 100 : 0}%`}}></div>
          </div>
        </div>
        
        {/* Summary */}
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">HR Dashboard</h1>
        <div className="flex items-center gap-2">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="px-3 py-2 border rounded-md bg-white text-sm">
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, idx) => (
              <option key={m} value={idx+1}>{m}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="px-3 py-2 border rounded-md bg-white text-sm">
            {Array.from({ length: 5 }).map((_, i) => {
              const y = new Date().getFullYear() - 2 + i;
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
          <button onClick={fetchHRMetrics} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
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
              <p className="text-sm text-gray-600 mb-1">Attendance rate (WFH)</p>
              <p className="text-3xl font-bold text-gray-900">{attMonthCounts.total ? Math.round((attMonthCounts.wfh / attMonthCounts.total) * 100) : 0}%</p>
              <p className="text-sm text-green-500 mt-1">{attTodayCounts.wfh || 0} work from home today</p>
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
              <p className="text-sm text-gray-600 mb-1">Attendance Rate (Present)</p>
              <p className="text-3xl font-bold text-gray-900">{attMonthCounts.total ? Math.round((attMonthCounts.present / attMonthCounts.total) * 100) : 0}%</p>
              <p className="text-sm text-green-500 mt-1">{attTodayCounts.present || 0} present today</p>
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
              <p className="text-3xl font-bold text-gray-900">{leaveCounts.pending || 0}</p>
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
              <p className="text-3xl font-bold text-gray-900">{attTodayCounts.leave || 0}</p>
              <p className="text-sm text-red-600 mt-1">Leave today</p>
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
              <p className="text-3xl font-bold text-gray-900">{expenseCounts.pendingHr || 0}</p>
              <p className="text-sm text-red-600 mt-1">+{expenseCounts.total || 0} this month</p>
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