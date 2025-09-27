import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useUser } from '@/contexts/UserContext';

const BASE_URL = 'http://127.0.0.1:8000';

const ManagerDashboard = () => {
  const { user } = useUser();
  const token = useMemo(() => localStorage.getItem('authToken'), []);
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [year, setYear] = useState(() => new Date().getFullYear());

  const [attendance, setAttendance] = useState({ present: 0, leave: 0, wfh: 0 });
  const [leaveCounts, setLeaveCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [expenseCounts, setExpenseCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const headers = useMemo(() => ({
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  }), [token]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);

        // Attendance for the manager (self)
        try {
          const resp = await fetch(`${BASE_URL}/attendance/daily?employee_id=${user?.employeeId}&year=${year}&month=${month}`, { headers });
          if (resp.ok) {
            const json = await resp.json();
            // Expect array of records with `action` field
            const records = Array.isArray(json) ? json : (json?.records || []);
            let present = 0, leave = 0, wfh = 0;
            for (const r of records) {
              const action = (r?.action || '').toLowerCase();
              if (['present', 'check-in', 'work', 'worked'].includes(action)) present += 1;
              else if (['leave', 'absent', 'holiday'].includes(action)) leave += 1;
              else if (['wfh', 'work_from_home', 'work from home'].includes(action)) wfh += 1;
            }
            setAttendance({ present, leave, wfh });
          }
        } catch (_) {}

        // Leave requests under manager
        try {
          const resp = await fetch(`${BASE_URL}/leave/leave-requests/${user?.employeeId}`, { headers });
          if (resp.ok) {
            const json = await resp.json();
            const list = Array.isArray(json) ? json : (json?.requests || json?.data || []);
            let pending = 0, approved = 0, rejected = 0;
            for (const item of list) {
              // Backend returns manager_status / final_status for leaves
              const raw = item?.manager_status || item?.final_status || item?.status || item?.leave_status || '';
              const s = String(raw).toLowerCase();
              if (['pending', 'in_review'].includes(s)) pending += 1;
              else if (['approved', 'accepted'].includes(s)) approved += 1;
              else if (['rejected', 'declined'].includes(s)) rejected += 1;
            }
            setLeaveCounts({ pending, approved, rejected });
          }
        } catch (_) {}

        // Expense requests under manager
        try {
          const resp = await fetch(
            `${BASE_URL}/expenses/mgr-exp-list?manager_id=${encodeURIComponent(user.employeeId)}&year=${year}&month=${month}`,
            { headers }
          );
          if (resp.ok) {
            const json = await resp.json();
            const list = Array.isArray(json) ? json : (json?.requests || json?.data || []);
            let pending = 0, approved = 0, rejected = 0;
            for (const item of list) {
              // Backend uses internal status codes for expenses
              const s = String(item?.status || '').toLowerCase();
              if (['pending', 'pending_manager_approval'].includes(s)) pending += 1;
              else if (['approved', 'pending_hr_approval'].includes(s)) approved += 1; // manager-approved moves to HR pending
              else if (['rejected', 'mgr_rejected'].includes(s)) rejected += 1;
            }
            setExpenseCounts({ pending, approved, rejected });
          }
        } catch (_) {}

      } catch (e) {
        setError(e.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user?.employeeId, headers, month, year]);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Manager Dashboard</h1>
        <MonthYearPicker />
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
  );
};

export default ManagerDashboard;