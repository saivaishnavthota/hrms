import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import AddAttendance from './AddAttendance';
import ApplyLeave from './ApplyLeave';

const TimeManagement = () => {
  const [activeTab, setActiveTab] = useState('attendance');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Arial, sans-serif' }}>Time Management</h1>
        

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 rounded-md p-1 w-full max-w-md">
          <TabsTrigger
  value="attendance"
  className={`flex-1 transition-all duration-200 rounded-lg h-10
    ${activeTab === 'attendance' 
      ? 'bg-[#3C6230] text-white shadow-[0_6px_20px_rgba(0,0,0,0.6)] -translate-y-1' 
      : 'text-[#5C636A] shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:-translate-y-0.5'}
  `}
>
  Book Your Time
</TabsTrigger>

<TabsTrigger
  value="leave"
  className={`flex-1 transition-all duration-200 rounded-lg h-10
    ${activeTab === 'leave' 
      ? 'bg-[#3C6230] text-white shadow-[0_6px_20px_rgba(0,0,0,0.6)] -translate-y-1' 
      : 'text-[#5C636A] shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:-translate-y-0.5'}
  `}
>
  Apply Leave
</TabsTrigger>



          </TabsList>

          <TabsContent value="attendance" className="mt-0">
            <AddAttendance />
          </TabsContent>

          <TabsContent value="leave" className="mt-0">
            <ApplyLeave />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TimeManagement;
