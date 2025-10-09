import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ManagerEmployeeAttendance from './EmployeesAttendance';
import AddAttendance from '@/components/Employee/AddAttendance';


const ManagerAttendance = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-sm text-muted-foreground">Manage attendance from the tabs below.</p>
      </div>
      <Tabs defaultValue="add_attendance" className="w-full">
        <TabsList className="grid grid-cols-2 gap-2 w-full">
          <TabsTrigger className="w-50 justify-center" value="add_attendance">Add Attendance</TabsTrigger>
          <TabsTrigger className="w-20 justify-center" value="employee_attendance">Employee Attendance</TabsTrigger>
        </TabsList>
        <TabsContent value="add_attendance" className="pt-4">
          <AddAttendance />
        </TabsContent>
        <TabsContent value="employee_attendance" className="pt-4">
          <ManagerEmployeeAttendance />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManagerAttendance;