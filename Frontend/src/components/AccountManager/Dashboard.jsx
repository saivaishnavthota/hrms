import React, { useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useUser } from '@/contexts/UserContext';
import useLivePoll from '@/hooks/useLivePoll';
import api from '@/lib/api';

const Dashboard = () => {
  const { user } = useUser();
  const token = useMemo(() => localStorage.getItem('authToken'), []);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const mapStatus = (item) => {
    const raw = (item.status || item.current_status || '').toLowerCase();
    if (raw.includes('pending')) return 'Pending';
    if (raw.includes('approved') || raw.includes('accept')) return 'Approved';
    if (raw.includes('rejected') || raw.includes('declined')) return 'Rejected';
    return 'Other';
  };

  const fetchData = useCallback(async () => {
    const accMgrId = user?.employeeId || localStorage.getItem('userId');
    if (!accMgrId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.get(`/expenses/acc-mgr-exp-list`, {
        params: { acc_mgr_id: accMgrId, year, month },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];

      const counts = { Pending: 0, Approved: 0, Rejected: 0 };
      list.forEach((item) => {
        const s = mapStatus(item);
        if (counts[s] !== undefined) counts[s] += 1;
      });

      const chartData = [
        { label: 'Pending', value: counts.Pending },
        { label: 'Approved', value: counts.Approved },
        { label: 'Rejected', value: counts.Rejected },
      ];

      setData(chartData);
    } catch (err) {
      console.error('Error fetching manager expenses for dashboard:', err);
      setError('Failed to load expense summary.');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [user?.employeeId, token, year, month]);

  useLivePoll(fetchData, { intervalMs: 5000, deps: [user?.employeeId, token, year, month] });

  const chartConfig = {
    Pending: { label: 'Pending', color: 'orange' },
    Approved: { label: 'Approved', color: 'green' },
    Rejected: { label: 'Rejected', color: 'red' },
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Expense Requests (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 text-center text-sm text-muted-foreground">Loading...</div>
            ) : error ? (
              <div className="py-10 text-center text-sm text-red-500">{error}</div>
            ) : (
              <ChartContainer config={chartConfig} className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="var(--color-Pending)" name="Pending" />
                  </BarChart>
                </ResponsiveContainer>
                <ChartLegend content={<ChartLegendContent />} />
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {data.map((d) => (
                <div key={d.label} className="rounded-md border p-4 text-center">
                  <div className="text-sm text-muted-foreground">{d.label}</div>
                  <div className="mt-2 text-2xl font-semibold">{d.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
