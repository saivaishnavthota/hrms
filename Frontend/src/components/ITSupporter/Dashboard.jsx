import React, { useEffect, useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Package, Users, Wrench } from 'lucide-react';
import { getAssets, getMaintenanceRecords } from '../../lib/api';

const ITSupporterDashboard = () => {
  const [loading, setLoading] = useState(true);

  // Dynamic data states
  const [totalAssets, setTotalAssets] = useState(0);
  const [underMaintenance, setUnderMaintenance] = useState(0);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [assetsRes, maintenanceRes] = await Promise.all([
          getAssets(),
          getMaintenanceRecords(),
        ]);

        setTotalAssets(assetsRes.length || 0);
        setUnderMaintenance(maintenanceRes.length || 0);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Chart data (based on fetched values)
  const statusData = useMemo(() => [
    { name: 'Available', value: totalAssets - underMaintenance },
    { name: 'Under Maintenance', value: underMaintenance },
  ], [totalAssets, underMaintenance]);

  const COLORS = ['#10b981', '#3b82f6']; // green, blue

  const maintenanceTrend = useMemo(() => (
    [
      { month: 'Apr', repairs: 0 },
      { month: 'May', repairs: 0 },
      { month: 'Jun', repairs: 0 },
      { month: 'Jul', repairs: 0 },
      { month: 'Aug', repairs: 0 },
      { month: 'Sep', repairs: underMaintenance }, // simple trend example
    ]
  ), [underMaintenance]);

  const percentAvailable = totalAssets ? Math.round(((totalAssets - underMaintenance) / totalAssets) * 100) : 0;
  const percentMaintenance = totalAssets ? Math.round((underMaintenance / totalAssets) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 text-lg">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Heading */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Assets Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Overview of assets and maintenance status.
            </p>
          </div>
        </div>
      </div>
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white shadow-sm rounded-lg p-5 flex items-center gap-4">
              <div className="p-3 rounded-md bg-blue-50 text-blue-600">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Assets</div>
                <div className="text-2xl font-semibold">{totalAssets}</div>
              </div>
            </div>
            <div className="bg-white shadow-sm rounded-lg p-5 flex items-center gap-4">
              <div className="p-3 rounded-md bg-amber-50 text-amber-600">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Under Maintenance</div>
                <div className="text-2xl font-semibold">{underMaintenance}</div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Pie Chart */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900">Asset Status Distribution</h2>
              <div className="mt-2 text-xs text-center">
                <span className="text-emerald-600 font-medium">
                  Available {percentAvailable}%
                </span>
              </div>
              <div className="mt-2 h-64">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={24} />
                    <Tooltip
                      cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                      formatter={(value, name) => [`${value}`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-center">
                <span className="text-blue-600 font-medium">
                  Under Maintenance {percentMaintenance}%
                </span>
              </div>
            </div>

            {/* Line Chart */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Maintenance Trend (Last 6 Months)
              </h2>
              <div className="mt-2 h-64">
                <ResponsiveContainer>
                  <LineChart data={maintenanceTrend} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip cursor={{ stroke: '#e5e7eb' }} />
                    <Legend />
                    <Line type="monotone" dataKey="repairs" name="Repairs" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
    </div>
  );
};

export default ITSupporterDashboard;