import React from 'react';

const ManagerEmployees = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Manager Employees</h1>
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <p className="text-sm text-gray-700">This page will list employees assigned to the manager, including name, company email, HR and project details.</p>
      </div>
    </div>
  );
};

export default ManagerEmployees;