import { Layout1Page } from '@/pages/layout-1/page';
import { Navigate, Route, Routes } from 'react-router';
import { Layout1 } from '@/components/layouts/layout-1';
// Employee layout now uses Layout1 with employee-specific menu
import { MENU_SIDEBAR_EMPLOYEE } from '@/config/employee-layout.config';
import { MENU_SIDEBAR_MANAGER } from '@/config/manager-layout.config';
import { MENU_SIDEBAR_ACCOUNT_MANAGER } from '@/config/account-manager-layout.config';
import EmployeeManagement from '@/components/HR/EmployeeManagement';
import Dashboard from '@/components/HR/Dashboard';
import ChangePassword from '@/components/HR/ChangePassword';
import LeaveRequests from '@/components/HR/LeaveRequests';
import AssignLeaves from '@/components/HR/AssignLeaves';
import AddAttendance from '@/components/HR/AddAttendance';
import EmployeeAttendance from '@/components/HR/EmployeeAttendance';
import Holidays from '@/components/HR/Holidays';
import OnboardingEmployees from '@/components/HR/OnboardingEmployees';
import ExpenseManagement from '@/components/HR/ExpenseManagement';
import DocumentCollection from '@/components/HR/DocumentCollection';
import PendingRequests from '@/components/HR/PendingRequests';
import ViewLeaveApplication from '@/components/HR/ViewLeaveApplication';
import Login from '@/components/auth/Login';
import EmployeePage from '@/pages/employee/page';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import NewUserDetails from '@/components/Onboarding/NewUserDetails';
import NewUserUploadDocs from '@/components/Onboarding/NewUserUploadDocs';
import ChangePasswordOnboarding from '@/components/auth/ChangePasswordOnboarding';
import MyProfile from '@/components/Profile/MyProfile';
// Employee components
import EmployeeAddAttendance from '@/components/Employee/AddAttendance';
import ApplyLeave from '@/components/Employee/ApplyLeave';
import SubmitExpense from '@/components/Employee/SubmitExpense';
import UploadDocuments from '@/components/Employee/UploadDocuments';
import SetPassword from '@/components/Employee/SetPassword';
// Manager components
import AccountManagerDashboard from '@/components/AccountManager/Dashboard';
import ManagerEmployees from '@/components/Manager/Employees';
import ManagerLeaveRequests from '@/components/Manager/LeaveRequests';
import AccountManagerExpenseManagement from '@/components/AccountManager/ExpenseManagement';
import Projects from '@/components/AccountManager/Projects';
import ManagerDashboard from '@/components/Manager/Dashboard';
import ManagerExpenseManagement from '@/components/Manager/ExpenseManagement';


export const AppRoutingSetup = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/change-password-onboarding" element={<ChangePasswordOnboarding />} />
      <Route path="/new-user-details" element={<NewUserDetails />} />
      <Route path="/upload-documents" element={<NewUserUploadDocs />} />
      
      {/* Protected HR routes */}
      <Route path="/hr" element={<ProtectedRoute allowedRoles={["Hr"]}><Layout1 /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="employee-management" element={<EmployeeManagement />} />
        <Route path="employees-form" element={<EmployeeManagement />} />
        <Route path="onboarding-employees" element={<OnboardingEmployees />} />
        <Route path="expense-management" element={<ExpenseManagement />} />
        <Route path="document-collection" element={<DocumentCollection />} />
        <Route path="pending-requests" element={<PendingRequests />} />
        <Route path="view-leave-application" element={<ViewLeaveApplication />} />
         <Route path="reset-password" element={< ChangePassword/>} />
        <Route path="leave-requests" element={<LeaveRequests />} />
        <Route path="assign-leaves" element={<AssignLeaves />} />
        <Route path="add-attendance" element={<AddAttendance />} />
        <Route path="employees-attendance" element={<EmployeeAttendance />} />
        <Route path="holidays" element={<Holidays />} />
      </Route>
      
      {/* Protected Employee routes using Layout1 with employee menu */}
      <Route path="/employee" element={<ProtectedRoute allowedRoles={["Employee"]}><Layout1 menu={MENU_SIDEBAR_EMPLOYEE} /></ProtectedRoute>}>
        <Route index element={<EmployeePage />} />
        <Route path="add-attendance" element={<EmployeeAddAttendance />} />
        <Route path="apply-leave" element={<ApplyLeave />} />
        <Route path="submit-expense" element={<SubmitExpense />} />
        <Route path="upload-documents" element={<UploadDocuments />} />
        <Route path="set-password" element={<SetPassword />} />
      </Route>
      
      {/* Layout-1 route */}
      <Route path="/layout-1" element={<ProtectedRoute><Layout1Page /></ProtectedRoute>} />
      
      {/* Protected Manager routes using Layout1 with manager menu */}
      <Route path="/manager" element={<ProtectedRoute allowedRoles={["Manager"]}><Layout1 menu={MENU_SIDEBAR_MANAGER} /></ProtectedRoute>}>
        <Route index element={<ManagerDashboard />} />
        <Route path="dashboard" element={<ManagerDashboard />} />
        <Route path="add-attendance" element={<EmployeeAddAttendance />} />
        <Route path="employees-attendance" element={<EmployeeAttendance />} />
        <Route path="employees" element={<ManagerEmployees />} />
        <Route path="apply-leave" element={<ApplyLeave />} />
        <Route path="leave-requests" element={<ManagerLeaveRequests />} />
        <Route path="expense-management" element={<ManagerExpenseManagement />} />
        <Route path="change-password" element={<SetPassword />} />
      </Route>

      {/* Protected Account Manager routes using Layout1 with account manager menu */}
      <Route path="/account-manager" element={<ProtectedRoute allowedRoles={["Account Manager"]}><Layout1 menu={MENU_SIDEBAR_ACCOUNT_MANAGER} /></ProtectedRoute>}>
        <Route index element={<AccountManagerDashboard />} />
        <Route path="dashboard" element={<AccountManagerDashboard />} />
        <Route path="expense-management" element={<AccountManagerExpenseManagement />} />
        <Route path="projects" element={<Projects />} />
        <Route path="change-password" element={<SetPassword />} />
      </Route>

      {/* My Profile route */}
      <Route path="/my-profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
      
      {/* Default route - redirect to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
