import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Package, Users, Wrench } from 'lucide-react';
import EmployeePage from '@/pages/employee/page';

const ITSupporterDashboard = () => {
  // Mock metrics (can be wired to real data later)
  const totalAssets = 4;
  const allocated = 2;
  const underMaintenance = 2;
  // Toggle to switch between IT Supporter and Employee dashboards
  const [showEmployeeView, setShowEmployeeView] = useState(false);

  const statusData = useMemo(() => (
    [
      { name: 'Allocated', value: allocated },
      { name: 'Under Maintenance', value: underMaintenance },
    ]
  ), [allocated, underMaintenance]);

  const COLORS = ['#10b981', '#3b82f6']; // green, blue

  const maintenanceTrend = useMemo(() => (
    [
      { month: 'Apr', repairs: 0 },
      { month: 'May', repairs: 0 },
      { month: 'Jun', repairs: 0 },
      { month: 'Jul', repairs: 0 },
      { month: 'Aug', repairs: 0 },
      { month: 'Sept', repairs: 0 },
    ]
  ), []);

  const percentAllocated = totalAssets ? Math.round((allocated / totalAssets) * 100) : 0;
  const percentMaintenance = totalAssets ? Math.round((underMaintenance / totalAssets) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Heading */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{showEmployeeView ? ' Activity Dashboard' : 'Assets Dashboard'}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {showEmployeeView
                ? 'Overview of your weekly attendance, leaves, and documents.'
                : 'Overview of assets, allocations, and maintenance.'}
            </p>
          </div>
          <button
            onClick={() => setShowEmployeeView((v) => !v)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-700 transition-colors"
          >
            {showEmployeeView ? 'Show Assets' : 'Show Activity'}
          </button>
        </div>
      </div>

      {showEmployeeView ? (
        // Render Employee Dashboard content
        <EmployeePage />
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white shadow-sm rounded-lg p-5 flex items-center gap-4">
              <div className="p-3 rounded-md bg-blue-50 text-blue-600"><Package className="w-6 h-6" /></div>
              <div>
                <div className="text-sm text-muted-foreground">Total Assets</div>
                <div className="text-2xl font-semibold">{totalAssets}</div>
              </div>
            </div>
            <div className="bg-white shadow-sm rounded-lg p-5 flex items-center gap-4">
              <div className="p-3 rounded-md bg-emerald-50 text-emerald-600"><Users className="w-6 h-6" /></div>
              <div>
                <div className="text-sm text-muted-foreground">Allocated</div>
                <div className="text-2xl font-semibold">{allocated}</div>
              </div>
            </div>
            <div className="bg-white shadow-sm rounded-lg p-5 flex items-center gap-4">
              <div className="p-3 rounded-md bg-amber-50 text-amber-600"><Wrench className="w-6 h-6" /></div>
              <div>
                <div className="text-sm text-muted-foreground">Under Maintenance</div>
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
                <span className="text-emerald-600 font-medium">Allocated {percentAllocated}%</span>
              </div>
              <div className="mt-2 h-64">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={24} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} formatter={(value, name) => [`${value}`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-center">
                <span className="text-blue-600 font-medium">Under Maintenance {percentMaintenance}%</span>
              </div>
            </div>

            {/* Line Chart */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900">Maintenance Trend (Last 6 Months)</h2>
              <div className="mt-2 h-64">
                <ResponsiveContainer>
                  <LineChart data={maintenanceTrend} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip cursor={{ stroke: '#e5e7eb' }} />
                    <Legend />
                    <Line type="monotone" dataKey="repairs" name="repairs" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ITSupporterDashboard;