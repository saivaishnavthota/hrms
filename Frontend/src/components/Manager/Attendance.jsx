import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ManagerEmployeeAttendance from './EmployeesAttendance';
import AddAttendance from '@/components/Employee/AddAttendance';


const ManagerAttendance = () => {
  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600 mt-1">Manage your attendance and view team attendance records</p>
        </div>
      </div>

      <Tabs defaultValue="add_attendance" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md bg-white shadow-sm border border-gray-200">
          <TabsTrigger 
            value="add_attendance" 
            className="flex items-center gap-2 data-[state=active]:bg-[#2D5016] data-[state=active]:text-white transition-all duration-200"
          >
            Book Your Time
          </TabsTrigger>
          <TabsTrigger 
            value="employee_attendance" 
            className="flex items-center gap-2 data-[state=active]:bg-[#2D5016] data-[state=active]:text-white transition-all duration-200"
          >
            Employee Attendance
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="add_attendance" className="mt-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <AddAttendance />
          </div>
        </TabsContent>
        
        <TabsContent value="employee_attendance" className="mt-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <ManagerEmployeeAttendance />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManagerAttendance;