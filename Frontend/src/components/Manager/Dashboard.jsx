import React, { useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useUser } from '@/contexts/UserContext';
import { CheckCircle, Home, CalendarDays, X as XIcon } from 'lucide-react';
import useLivePoll from '@/hooks/useLivePoll';
import api from "@/lib/api";



const ManagerDashboard = () => {
  const { user } = useUser();
  const token = useMemo(() => localStorage.getItem('authToken'), []);
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [year, setYear] = useState(() => new Date().getFullYear());

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendance, setAttendance] = useState({ present: 0, leave: 0, wfh: 0 });
  const [leaveCounts, setLeaveCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [expenseCounts, setExpenseCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const headers = useMemo(() => ({
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  }), [token]);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Attendance for the manager (self)
      try {
        const qs = new URLSearchParams({
          manager_id: String(user?.employeeId || ''),
          year: String(year),
          month: String(month),
        });
        const resp = await api.get(`/attendance/daily?${qs.toString()}`, { headers });
        const records = Array.isArray(resp.data) ? resp.data : (resp.data?.records || []);
        setAttendanceRecords(records);

        let present = 0, leave = 0, wfh = 0;
        for (const r of records) {
          const status = r?.status;
          if (status === 'Present') present += 1;
          else if (status === 'WFH') wfh += 1;
          else if (status === 'Leave') leave += 1;
        }
        setAttendance({ present, leave, wfh });
      } catch (e) { console.error('Attendance fetch error:', e);}

      // Leave requests under manager
      try {
        const resp = await api.get(`/leave/leave-requests/${user?.employeeId}`, { headers });
        const list = Array.isArray(resp.data) ? resp.data : (resp.data?.requests || resp.data?.data || []);
        let pending = 0, approved = 0, rejected = 0;
        for (const item of list) {
          const raw = item?.manager_status || item?.final_status || item?.status || item?.leave_status || '';
          const s = String(raw).toLowerCase();
          if (['pending', 'in_review'].includes(s)) pending += 1;
          else if (['approved', 'accepted'].includes(s)) approved += 1;
          else if (['rejected', 'declined'].includes(s)) rejected += 1;
        }
        setLeaveCounts({ pending, approved, rejected });
      } catch (e) { console.error('Leave fetch error:', e);}

      // Expense requests under manager
      try {
        const resp = await api.get(`/expenses/mgr-exp-list`, {
          headers,
          params: { manager_id: user?.employeeId, year, month }
        });
        const list = Array.isArray(resp.data) ? resp.data : (resp.data?.requests || resp.data?.data || []);
        let pending = 0, approved = 0, rejected = 0;
        for (const item of list) {
          const s = String(item?.status || '').toLowerCase();
          if (['pending', 'pending_manager_approval'].includes(s)) pending += 1;
          else if (['approved', 'pending_hr_approval'].includes(s)) approved += 1;
          else if (['rejected', 'mgr_rejected'].includes(s)) rejected += 1;
        }
        setExpenseCounts({ pending, approved, rejected });
      } catch (_) {}

    } catch (e) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user?.employeeId, headers, month, year]);

  useLivePoll(
  () => { if(user?.employeeId) fetchAll(); },
  { intervalMs: 5000, deps: [user?.employeeId, headers, month, year] }
);



  const getCounts = (records) => {
    let present = 0, wfh = 0, leave = 0;
    for (const r of records) {
      const status = r?.status;
      if (status === 'Present') present += 1;
      else if (status === 'WFH') wfh += 1;
      else if (status === 'Leave') leave += 1;
    }
    return { present, wfh, leave };
  };

  const monthlyCounts = getCounts(attendanceRecords);
  const latestDate = attendanceRecords.reduce((max, r) => (r?.date && (!max || r.date > max)) ? r.date : max, null);
  const dailyCounts = getCounts(attendanceRecords.filter(r => r?.date === latestDate));

  const attendanceData = [
    { label: 'Present', value: attendance.present, fill: 'var(--color-present)' },
    { label: 'Leave', value: attendance.leave, fill: 'var(--color-leave)' },
    { label: 'WFH', value: attendance.wfh, fill: 'var(--color-wfh)' },
  ];

  const leaveData = [
    { label: 'Pending', value: leaveCounts.pending, fill: 'var(--color-pending)' },
    { label: 'Approved', value: leaveCounts.approved, fill: 'var(--color-approved)' },
    { label: 'Rejected', value: leaveCounts.rejected, fill: 'var(--color-rejected)' },
  ];

  const expenseData = [
    { label: 'Pending', value: expenseCounts.pending, fill: 'var(--color-pending)' },
    { label: 'Approved', value: expenseCounts.approved, fill: 'var(--color-approved)' },
    { label: 'Rejected', value: expenseCounts.rejected, fill: 'var(--color-rejected)' },
  ];

  const MonthYearPicker = () => (
    <div className="flex gap-2 items-center">
      <select className="border rounded px-2 py-1" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select className="border rounded px-2 py-1" value={year} onChange={(e) => setYear(Number(e.target.value))}>
        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          
          <MonthYearPicker />
        </div>

      {/* Summary counts (Monthly and latest Daily) below filters, aligned with EmployeesAttendance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monthly Summary */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gray-700" />
            <span className="text-sm font-semibold text-gray-800">Monthly Summary</span>
          </div>
          <div className="p-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-3">
              <div className="text-xs font-medium text-green-800 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Present
              </div>
              <div className="mt-1 text-2xl font-bold text-green-900">{monthlyCounts.present}</div>
            </div>
            <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-3">
              <div className="text-xs font-medium text-green-800 flex items-center gap-1">
                <Home className="h-3 w-3" /> WFH
              </div>
              <div className="mt-1 text-2xl font-bold text-green-900">{monthlyCounts.wfh}</div>
            </div>
            <div className="rounded-lg border border-red-200 bg-gradient-to-br from-red-50 to-red-100 p-3">
              <div className="text-xs font-medium text-red-800 flex items-center gap-1">
                <XIcon className="h-3 w-3" /> Leave
              </div>
              <div className="mt-1 text-2xl font-bold text-red-900">{monthlyCounts.leave}</div>
            </div>
          </div>
        </div>

        {/* Daily Summary (latest date with data) */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gray-700" />
            <span className="text-sm font-semibold text-gray-800">Daily Summary{latestDate ? ` — ${latestDate}` : ''}</span>
          </div>
          <div className="p-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-3">
              <div className="text-xs font-medium text-green-800 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Present
              </div>
              <div className="mt-1 text-2xl font-bold text-green-900">{dailyCounts.present}</div>
            </div>
            <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-3">
              <div className="text-xs font-medium text-green-800 flex items-center gap-1">
                <Home className="h-3 w-3" /> WFH
              </div>
              <div className="mt-1 text-2xl font-bold text-green-900">{dailyCounts.wfh}</div>
            </div>
            <div className="rounded-lg border border-red-200 bg-gradient-to-br from-red-50 to-red-100 p-3">
              <div className="text-xs font-medium text-red-800 flex items-center gap-1">
                <XIcon className="h-3 w-3" /> Leave
              </div>
              <div className="mt-1 text-2xl font-bold text-red-900">{dailyCounts.leave}</div>
            </div>
          </div>
        </div>
      </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                present: { label: 'Present', color: '#10b981' },
                leave: { label: 'Leave', color: '#ef4444' },
                wfh: { label: 'WFH', color: '#3b82f6' },
              }}
              className="h-56 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData}>
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Leave Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                pending: { label: 'Pending', color: '#f59e0b' },
                approved: { label: 'Approved', color: '#10b981' },
                rejected: { label: 'Rejected', color: '#ef4444' },
              }}
              className="h-56 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leaveData}>
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allow decimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Expense Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                pending: { label: 'Pending', color: '#f59e0b' },
                approved: { label: 'Approved', color: '#10b981' },
                rejected: { label: 'Rejected', color: '#ef4444' },
              }}
              className="h-56 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseData}>
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;