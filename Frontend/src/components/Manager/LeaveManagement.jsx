import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ApplyLeave from '@/components/Employee/ApplyLeave';
import ManagerLeaveRequests from './LeaveRequests';

const ManagerLeaveManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('apply-leave');

  useEffect(() => {
    // Set the active tab based on the current route
    if (location.pathname.includes('leave-requests')) {
      setActiveTab('leave-requests');
    } else if (location.pathname.includes('leave-management')) {
      setActiveTab('apply-leave'); // Default to Apply Leave for main route
    } else {
      setActiveTab('apply-leave');
    }
  }, [location.pathname]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    // Navigate to the appropriate route
    if (value === 'leave-requests') {
      navigate('/manager/leave-requests');
    } else {
      navigate('/manager/apply-leave');
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Leave Management</h1>
          <p className="text-gray-600 mt-1">Manage your leave applications and team leave requests</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md bg-white shadow-sm border border-gray-200">
          <TabsTrigger 
            value="apply-leave" 
            className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-200"
          >
            Apply Leave
          </TabsTrigger>
          <TabsTrigger 
            value="leave-requests" 
            className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-200"
          >
            Leave Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apply-leave" className="mt-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <ApplyLeave />
          </div>
        </TabsContent>

        <TabsContent value="leave-requests" className="mt-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <ManagerLeaveRequests />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManagerLeaveManagement;
