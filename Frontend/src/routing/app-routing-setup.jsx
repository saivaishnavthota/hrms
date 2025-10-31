import { Layout1Page } from '@/pages/layout-1/page';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout1 } from '@/components/layouts/layout-1';
import { HRLayoutWrapper } from '@/components/layouts/HRLayoutWrapper';
// Employee layout now uses Layout1 with employee-specific menu
import { MENU_SIDEBAR_EMPLOYEE } from '@/config/employee-layout.config';
import { MENU_SIDEBAR_INTERN } from '@/config/intern-layout.config';
import { MENU_SIDEBAR_MANAGER } from '@/config/manager-layout.config';
import { MENU_SIDEBAR_ACCOUNT_MANAGER } from '@/config/account-manager-layout.config';
import { MENU_SIDEBAR_IT_SUPPORTER } from '@/config/it-supporter-layout.config';
import { MENU_SIDEBAR_ADMIN } from '@/config/admin-layout.config';
import { AdminLayoutWrapper } from '@/components/layouts/AdminLayoutWrapper';
import { EmployeeLayout } from '@/components/layouts/employee-layout';
import EmployeeManagement from '@/components/HR/EmployeeManagement';
import Dashboard from '@/components/HR/Dashboard';
import ChangePassword from '@/components/HR/ChangePassword';
import LeaveRequests from '@/components/HR/LeaveRequests';
import AssignLeaves from '@/components/HR/AssignLeaves';
import SoftwareRequestCompletion from '@/components/ITSupporter/SoftwareRequestCompletion';

import EmployeeAttendance from '@/components/HR/EmployeeAttendance';
import Holidays from '@/components/HR/Holidays';
import OnboardingEmployees from '@/components/HR/OnboardingEmployees';
import ExpenseManagement from '@/components/HR/ExpenseManagement';
import DocumentCollection from '@/components/HR/DocumentCollection';
import PendingRequests from '@/components/HR/PendingRequests';
import ViewLeaveApplication from '@/components/HR/ViewLeaveApplication';
import AddCompanyPolicy from '@/components/HR/AddCompanyPolicy';
import Login from '@/components/auth/Login';
import EntraCallback from '@/components/auth/EntraCallback';
import EmployeePage from '@/pages/employee/page';
import InternPage from '@/pages/intern/page';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import NewUserDetails from '@/components/Onboarding/NewUserDetails';
import NewUserUploadDocs from '@/components/Onboarding/NewUserUploadDocs';
import ChangePasswordOnboarding from '@/components/auth/ChangePasswordOnboarding';
import MyProfile from '@/components/Profile/MyProfile';
import MyActivity from '@/components/HR/MyActivity';
// Employee components
import EmployeeAddAttendance from '@/components/Employee/AddAttendance';
import HRAddAttendance from '@/components/Employee/AddAttendance';
import ManagerAddAttendance from '@/components/Employee/AddAttendance';
import ApplyLeave from '@/components/Employee/ApplyLeave';
import TimeManagement from '@/components/Employee/TimeManagement';
import SubmitExpense from '@/components/Employee/SubmitExpense';
import UploadDocuments from '@/components/Employee/UploadDocuments';
import SoftwareRequest from '@/components/Employee/SoftwareRequest';
import SetPassword from '@/components/Employee/SetPassword';
// Manager components
import AccountManagerDashboard from '@/components/AccountManager/Dashboard';
import ManagerEmployees from '@/components/Manager/Employees';
import ManagerLeaveRequests from '@/components/Manager/LeaveRequests';
import ManagerLeaveManagement from '@/components/Manager/LeaveManagement';
import AccountManagerExpenseManagement from '@/components/AccountManager/ExpenseManagement';
import Projects from '@/components/AccountManager/Projects';
import ManagerDashboard from '@/components/Manager/Dashboard';
import ManagerExpenseManagement from '@/components/Manager/ExpenseManagement';
import ManagerEmployeeAttendance from '@/components/Manager/EmployeesAttendance';
import SoftwareRequestApproval from '@/components/Manager/SoftwareRequestApproval';
import ManagerAttendance from '@/components/Manager/Attendance';
import EmployeeAllocationDashboard from '@/components/Manager/EmployeeAllocationDashboard';
import AccountManagerAllocationDashboard from '@/components/AccountManager/AccountManagerAllocationDashboard';
import HRAllocationDashboard from '@/components/HR/HRAllocationDashboard';
import SuperHRAllocationDashboard from '@/components/HR/SuperHRAllocationDashboard';
// Super HR components
import HRConfig from '@/components/HR/HRConfig';
import ITSupporterDashboard from '@/components/ITSupporter/Dashboard';
import ITSupporterAssets from '@/components/ITSupporter/Assets';
import ITSupporterVendors from '@/components/ITSupporter/Vendors';

import ITSupporterAllocations from '@/components/ITSupporter/Allocations';
import ITSupporterMaintanance from '@/components/ITSupporter/Maintanance';
import ITSupporterMyActivity from '@/components/ITSupporter/MyActivity';
import AssetAllocations from '@/components/HR/AssetAllocations';
import ProjectAllocations from '@/components/HR/ProjectAllocations';
import EmployeeImport from '@/components/HR/EmployeeImport';
import AdminDashboard from '@/components/Admin/Dashboard';
import AdminEmployeeAttendance from '@/components/Admin/EmployeeAttendance';
import AdminLeaveRequests from '@/components/Admin/LeaveRequests';
import AdminExpenseManagement from '@/components/Admin/ExpenseManagement';

export const AppRoutingSetup = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/oauth2/redirect/microsoft" element={<EntraCallback />} />
      <Route path="/change-password-onboarding" element={<ChangePasswordOnboarding />} />
      <Route path="/new-user-details" element={<NewUserDetails />} />
      <Route path="/upload-documents" element={<NewUserUploadDocs />} />

      {/* Protected HR routes */}
      <Route path="/hr" element={<ProtectedRoute allowedRoles={["Hr"]}><HRLayoutWrapper /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="employee-management" element={<EmployeeManagement />} />
        <Route path="employees-form" element={<EmployeeManagement />} />
        <Route path="onboarding-employees" element={<OnboardingEmployees />} />
        <Route path="expense-management" element={<ExpenseManagement />} />
        <Route path="view-projects" element={<Projects viewOnly />} />
        <Route path="document-collection" element={<DocumentCollection />} />
        <Route path="pending-requests" element={<PendingRequests />} />
        <Route path="view-leave-application" element={<ViewLeaveApplication />} />
        <Route path="change-password" element={< ChangePassword />} />
        <Route path="leave-requests" element={<LeaveRequests />} />
        <Route path="assign-leaves" element={<AssignLeaves />} />
        <Route path="add-attendance" element={<HRAddAttendance />} />
        <Route path="employees-attendance" element={<EmployeeAttendance />} />
        <Route path="holidays" element={<Holidays />} />
        <Route path="add-policies" element={<AddCompanyPolicy />} />
        <Route path="reset-password" element={< ChangePassword />} />
        <Route path="my-activity" element={<MyActivity />} />
        <Route path="asset-allocations" element={<AssetAllocations />} />
        <Route path="project-allocations" element={<ProjectAllocations />} />
        <Route path="employee-import" element={<EmployeeImport />} />
        <Route path="employee-allocation-dashboard" element={<HRAllocationDashboard />} />
      </Route>

      {/* Protected Super-HR routes */}
      <Route path="/super-hr" element={<ProtectedRoute allowedRoles={["Hr"]} requireSuperHR={true}><HRLayoutWrapper /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="employee-management" element={<EmployeeManagement />} />
        <Route path="onboarding-employees" element={<OnboardingEmployees />} />
        <Route path="expense-management" element={<ExpenseManagement />} />
        <Route path="view-projects" element={<Projects viewOnly />} />
        <Route path="document-collection" element={<DocumentCollection />} />
        <Route path="leave-requests" element={<LeaveRequests />} />
        <Route path="assign-leaves" element={<AssignLeaves />} />
        <Route path="employees-attendance" element={<EmployeeAttendance />} />
        <Route path="holidays" element={<Holidays />} />
        <Route path="add-policies" element={<AddCompanyPolicy />} />
        <Route path="hr-config" element={<HRConfig />} />
        <Route path="asset-allocations" element={<AssetAllocations />} />
        <Route path="project-allocations" element={<ProjectAllocations />} />
        <Route path="my-activity" element={<MyActivity />} />
        <Route path="employee-allocation-dashboard" element={<SuperHRAllocationDashboard />} />
      </Route>

      {/* Protected Employee routes using custom EmployeeLayout (no top tabs) */}
      <Route path="/employee" element={<ProtectedRoute allowedRoles={["Employee"]}><EmployeeLayout /></ProtectedRoute>}>
        <Route index element={<EmployeePage />} />
        <Route path="time-management" element={<TimeManagement />} />
        <Route path="submit-expense" element={<SubmitExpense />} />
        <Route path="upload-documents" element={<UploadDocuments />} />
        <Route path="software-requests" element={<SoftwareRequest />} />
        <Route path="set-password" element={<SetPassword />} />
      </Route>

      {/* Protected Intern routes using Layout1 with intern menu */}
      <Route path="/intern" element={<ProtectedRoute allowedRoles={["Intern"]}><Layout1 menu={MENU_SIDEBAR_INTERN} /></ProtectedRoute>}>
        <Route index element={<InternPage />} />
        <Route path="time-management" element={<TimeManagement />} />
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
        <Route path="attendance" element={<ManagerAttendance />} />
        <Route path="add-attendance" element={<ManagerAddAttendance />} />
        <Route path="employees-attendance" element={<ManagerEmployeeAttendance />} />
        <Route path="employees" element={<ManagerEmployees />} />
        <Route path="leave-management" element={<ManagerLeaveManagement />} />
        <Route path="apply-leave" element={<ManagerLeaveManagement />} />
        <Route path="leave-requests" element={<ManagerLeaveManagement />} />
        <Route path="expense-management" element={<ManagerExpenseManagement />} />
        <Route path="upload-documents" element={<UploadDocuments />} />
        <Route path="software-requests" element={<SoftwareRequestApproval />} />
        <Route path="employee-allocation-dashboard" element={<EmployeeAllocationDashboard />} />
        <Route path="change-password" element={<SetPassword />} />
      </Route>

      {/* Protected Account Manager routes using Layout1 with account manager menu */}
      <Route path="/account-manager" element={<ProtectedRoute allowedRoles={["Account Manager"]}><Layout1 menu={MENU_SIDEBAR_ACCOUNT_MANAGER} /></ProtectedRoute>}>
        <Route index element={<AccountManagerDashboard />} />
        <Route path="dashboard" element={<AccountManagerDashboard />} />
        <Route path="expense-management" element={<AccountManagerExpenseManagement />} />
        <Route path="upload-documents" element={<UploadDocuments />} />
        <Route path="add-attendance" element={<EmployeeAddAttendance />} />
        <Route path="apply-leave" element={<ApplyLeave />} />
        <Route path="projects" element={<Projects />} />
        <Route path="project-allocations" element={<ProjectAllocations />} />
        <Route path="employee-allocation-dashboard" element={<AccountManagerAllocationDashboard />} />
        <Route path="change-password" element={<SetPassword />} />
        {/* <Route path="my-profile" element={<MyProfile />} /> */}
      </Route>

      {/* My Profile route */}
      <Route path="/my-profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />

      {/* Default route - redirect to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public IT Supporter demo routes using Layout1 with IT menu (no auth) */}
      {/* <Route path="/it-supporter-demo" element={<Layout1 menu={MENU_SIDEBAR_IT_SUPPORTER.map(item => ({ ...item, path: item.path.replace('/it-supporter', '/it-supporter-demo') }))} />}>
        <Route index element={<ITSupporterDashboard />} />
        <Route path="dashboard" element={<ITSupporterDashboard />} />
        <Route path="assets" element={<ITSupporterAssets />} />
        <Route path="vendors" element={<ITSupporterVendors />} />
        <Route path="employees" element={<ITSupporterEmployees />} />
        <Route path="allocations" element={<ITSupporterAllocations />} />
        <Route path="maintanance" element={<ITSupporterMaintanance />} />
        <Route path="my-activity" element={<ITSupporterMyActivity />} />
      </Route> */}

      {/* Protected IT Supporter routes using Layout1 with IT Supporter menu */}
      <Route path="/it-supporter" element={<ProtectedRoute allowedRoles={["IT Admin"]}><Layout1 menu={MENU_SIDEBAR_IT_SUPPORTER} /></ProtectedRoute>}>
        <Route index element={<ITSupporterDashboard />} />
        <Route path="dashboard" element={<ITSupporterDashboard />} />
        <Route path="assets" element={<ITSupporterAssets />} />
        <Route path="vendors" element={<ITSupporterVendors />} />
       
        <Route path="allocations" element={<ITSupporterAllocations />} />
        <Route path="maintanance" element={<ITSupporterMaintanance />} />
        <Route path="software-requests" element={<SoftwareRequestCompletion />} />
        <Route path="my-activity" element={<ITSupporterMyActivity />} />
      </Route>

      {/* Protected Admin routes - Full system access (View Only) using Layout1 */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={["Admin"]}><Layout1 menu={MENU_SIDEBAR_ADMIN} /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        {/* HR Features - View Only with Admin-specific routes */}
        <Route path="employee-management" element={<EmployeeManagement />} />
        <Route path="onboarding-employees" element={<OnboardingEmployees />} />
        <Route path="employees-attendance" element={<AdminEmployeeAttendance />} />
        <Route path="leave-requests" element={<AdminLeaveRequests />} />
        <Route path="assign-leaves" element={<AssignLeaves />} />
        <Route path="expense-management" element={<AdminExpenseManagement />} />
        <Route path="document-collection" element={<DocumentCollection />} />
        <Route path="view-projects" element={<Projects viewOnly />} />
        <Route path="holidays" element={<Holidays />} />
        <Route path="add-policies" element={<AddCompanyPolicy />} />
        <Route path="hr-config" element={<HRConfig />} />
        {/* IT Features - View Only */}
        <Route path="assets" element={<ITSupporterAssets />} />
        <Route path="vendors" element={<ITSupporterVendors />} />
        <Route path="allocations" element={<ITSupporterAllocations />} />
        <Route path="maintanance" element={<ITSupporterMaintanance />} />
        <Route path="software-requests" element={<SoftwareRequestCompletion />} />
        <Route path="project-allocations" element={<ProjectAllocations />} />
      </Route>
    </Routes>
  );
};
