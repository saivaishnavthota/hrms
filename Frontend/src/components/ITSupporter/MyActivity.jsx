import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import AddAttendance from '@/components/Employee/AddAttendance';
import ApplyLeave from '@/components/Employee/ApplyLeave';
import UploadDocuments from '@/components/Employee/UploadDocuments';
import SubmitExpense from '@/components/Employee/SubmitExpense';

const ITSupporterMyActivity = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">My Activity</h1>
        <p className="text-sm text-muted-foreground mb-6">Quickly manage attendance, leave, expenses, and documents.</p>

        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className="mb-6 bg-gray-100 rounded-md p-1">
            <TabsTrigger value="attendance">Add Attendance</TabsTrigger>
            <TabsTrigger value="leave">Apply Leave</TabsTrigger>
            {/* <TabsTrigger value="expense">Submit Expense</TabsTrigger> */}
            <TabsTrigger value="documents">Upload Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="mt-0">
            <AddAttendance />
          </TabsContent>

          <TabsContent value="leave" className="mt-0">
            <ApplyLeave />
          </TabsContent>

          {/* <TabsContent value="expense" className="mt-0">
            <SubmitExpense />
          </TabsContent> */}

          <TabsContent value="documents" className="mt-0">
            <UploadDocuments />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ITSupporterMyActivity;