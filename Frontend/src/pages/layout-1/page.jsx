import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/components/layouts/layout-1/components/toolbar';
import Dashboard from '@/components/HR/Dashboard';
import ExpenseManagement from '@/components/HR/ExpenseManagement';
import OnboardingEmployees from '@/components/HR/OnboardingEmployees';
import DocumentCollection from '@/components/HR/DocumentCollection';
import { useUser } from '@/contexts/UserContext';

export function Layout1Page() {
  const location = useLocation();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState({
    from: new Date(2025, 0, 20),
    to: addDays(new Date(2025, 0, 20), 20),
  });
  const [tempDateRange, setTempDateRange] = useState(date);

  const handleDateRangeApply = () => {
    setDate(tempDateRange); // Save the temporary date range to the main state
    setIsOpen(false); // Close the popover
  };

  const handleDateRangeReset = () => {
    setTempDateRange(undefined); // Reset the temporary date range
  };

  const defaultStartDate = new Date(); // Default start date fallback

  // Get page info based on current route
  const getPageInfo = () => {
    switch (location.pathname) {
      case '/hr/employees-attendance':
        return {
          title: 'Employees Attendance',
          description: 'Track and manage employee attendance',
          content: 'Employee attendance tracking will be implemented here. This will show attendance records and management features.'
        };
      case '/hr/employees-form':
        return {
          title: 'Employees Form',
          description: 'Manage employee information and assignments',
          content: 'Employee form management will be implemented here. This will connect to APIs: GET /users/employees, GET /users/managers, GET /users/hrs, POST /users/assign'
        };
      case '/hr/onboarding-employees':
        return {
          title: 'Onboarding Employees',
          description: 'View and manage onboarded employees',
          content: 'Onboarded employees management will be implemented here. This will show employee onboarding status and related actions.'
        };
      case '/hr/document-collection':
        return {
          title: 'Documents Collection',
          description: 'Manage employee document uploads and verification',
          content: 'Document collection management will be implemented here. This will connect to APIs: POST /documents/upload, GET /documents/{employeeId}, POST /show-documents/{employeeId}'
        };
      case '/hr/leave-management':
        return {
          title: 'Leave Management',
          description: 'Process and manage employee leave requests',
          content: 'Leave management system will be implemented here. This will connect to APIs: GET /hr/pending-leaves, GET /hr/all-leaves, POST /hr/leave-action/{leaveId}'
        };
      case '/hr/expense-management':
        return {
          title: 'Expense Management',
          description: 'Review and approve employee expense claims',
          content: 'Expense management system will be implemented here. This will connect to APIs: GET /expenses/employee/{employeeId}, POST /expenses/submit-exp, PUT /expenses/mgr-upd-status/{id}'
        };
      case '/hr/change-password':
        return {
          title: 'Change Password',
          description: 'Update your account password',
          content: 'Password change functionality will be implemented here. This will connect to API: POST /users/change-password'
        };
      default:
        return {
          title: 'HR Dashboard',
          description: 'Welcome to HR Management System',
          content: 'This is the main HR dashboard. Select a menu item from the sidebar to access specific HR functions.'
        };
    }
  };

  const pageInfo = getPageInfo();
  const role = user?.role || 'HR';
  const name = user?.name || '';
  const welcomeTitle = `Welcome to ${role} Portal - ${name}`;

  return (
    <div className="container">
      <Toolbar>
        <ToolbarHeading>
          <ToolbarPageTitle>{welcomeTitle}</ToolbarPageTitle>
          <ToolbarDescription>
            {pageInfo.title}: {pageInfo.description}
          </ToolbarDescription>
        </ToolbarHeading>
        <ToolbarActions>
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button id="date" variant="outline">
                <CalendarDays size={16} className="me-0.5" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, 'LLL dd, y')} -{' '}
                      {format(date.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(date.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={tempDateRange?.from || defaultStartDate}
                selected={tempDateRange}
                onSelect={setTempDateRange}
                numberOfMonths={2}
              />

              <div className="flex items-center justify-end gap-1.5 border-t border-border p-3">
                <Button variant="outline" onClick={handleDateRangeReset}>
                  Reset
                </Button>
                <Button onClick={handleDateRangeApply}>Apply</Button>
              </div>
            </PopoverContent>
          </Popover>
        </ToolbarActions>
      </Toolbar>

      <div className="bg-card rounded-lg p-6 grow">
        {/* Render ExpenseManagement component for expense management route */}
        {location.pathname === '/hr/expense-management' ? (
          <ExpenseManagement />
        ) : location.pathname === '/hr/onboarding-employees' ? (
          <OnboardingEmployees />
        ) : location.pathname === '/hr/document-collection' ? (
          <DocumentCollection />
        ) : (
          <div className="space-y-4">
            <div className="text-lg font-medium text-card-foreground">
              {pageInfo.content}
            </div>
            
            {location.pathname.startsWith('/hr/') && (
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-medium mb-2">Implementation Status</h3>
                <p className="text-sm text-muted-foreground">
                  This page is ready for HR functionality implementation. The sidebar navigation and layout features are fully functional. 
                  Backend API endpoints are documented and ready for integration.
                </p>
              </div>
            )}
            
            {location.pathname === '/layout-1' && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">👥 Employee Management</h3>
                  <p className="text-sm text-muted-foreground">Create, manage, and track employee information</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">📄 Document Management</h3>
                  <p className="text-sm text-muted-foreground">Handle employee document uploads and verification</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">🏖️ Leave Management</h3>
                  <p className="text-sm text-muted-foreground">Process leave requests and manage approvals</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">💰 Expense Management</h3>
                  <p className="text-sm text-muted-foreground">Review and approve expense claims</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">📊 Attendance Tracking</h3>
                  <p className="text-sm text-muted-foreground">Monitor and manage employee attendance</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">🔐 Security</h3>
                  <p className="text-sm text-muted-foreground">Manage passwords and access control</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
