import React from 'react';

const ManagerDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Manager Dashboard</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-800">Quick Actions</h2>
          <p className="text-sm text-gray-600 mt-2">Access attendance, leaves, employees and expenses.</p>
        </div>
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-800">Pending Requests</h2>
          <p className="text-sm text-gray-600 mt-2">Review pending leave and expense requests.</p>
        </div>
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-800">Team Overview</h2>
          <p className="text-sm text-gray-600 mt-2">Summary of assigned employees and attendance.</p>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;