import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLayout } from './context';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { Footer } from './footer';
import { Navbar } from '@/components/layouts/layout-1/shared/navbar/navbar';
import { NavbarMenu } from '@/components/layouts/layout-1/shared/navbar/navbar-menu';
import { MENU_SIDEBAR_ADMIN } from '@/config/admin-layout.config';
import {
  Users,
  FileText,
  Upload,
  CalendarCheck,
  UserCheck,
  Settings,
  DollarSign,
  BarChart2,
  CreditCard,
  CalendarSearch,
  FileIcon,
  LayoutGrid,
  Coins,
  Monitor
} from 'lucide-react';

export function Main({ menu }) {
  const isMobile = useIsMobile();
  const { sidebarCollapse } = useLayout();
  const { pathname } = useLocation();
  const isHR = pathname.startsWith('/hr');
  // New: detect other role paths to use HR-style top navbar without labels and no sidebar
  const isEmployee = pathname.startsWith('/employee');
  const isIntern = pathname.startsWith('/intern');
  const isManager = pathname.startsWith('/manager');
  const isAccountManager = pathname.startsWith('/account-manager');
  const isSuperHRPath = pathname.startsWith('/super-hr');
  const isITSupporter = pathname.startsWith('/it-supporter') || pathname.startsWith('/it-supporter-demo');
  const isAdmin = pathname.startsWith('/admin');
  const showTopNavbar = isHR || isSuperHRPath || isEmployee || isIntern || isManager || isAccountManager || isITSupporter || isAdmin;
  const showSidebar = !showTopNavbar && !isMobile; // remove sidebar for HR + other roles including IT Supporter
  const [activeParent, setActiveParent] = useState(null);

  useEffect(() => {
    const bodyClass = document.body.classList;

    if (showSidebar && sidebarCollapse) {
      bodyClass.add('sidebar-collapse');
    } else {
      bodyClass.remove('sidebar-collapse');
    }
  }, [sidebarCollapse, showSidebar]);

  useEffect(() => {
    const bodyClass = document.body.classList;

    // Base layout classes
    bodyClass.add('demo1');
    bodyClass.add('header-fixed');
    // Only layouts that actually show sidebar get sidebar-fixed styles
    if (showSidebar) {
      bodyClass.add('sidebar-fixed');
    }

    const timer = setTimeout(() => {
      bodyClass.add('layout-initialized');
    }, 1000);

    return () => {
      bodyClass.remove('demo1');
      bodyClass.remove('header-fixed');
      bodyClass.remove('layout-initialized');
      bodyClass.remove('sidebar-fixed');
      bodyClass.remove('sidebar-collapse');
      clearTimeout(timer);
    };
  }, [showSidebar]);

  useEffect(() => {
    // Reset sub navbar when path changes (e.g., navigation)
    setActiveParent(null);
  }, [pathname]);

  const EMPLOYEE_OPERATIONS = [
    { title: 'Employees', path: (isSuperHRPath ? '/super-hr/employee-management' : '/hr/employee-management'), icon: Users },
    // Only Super HR can see Onboarding Employees
    ...(isSuperHRPath ? [{ title: 'Onboarding Employees', path: '/super-hr/onboarding-employees', icon: UserCheck }] : []),
    { title: 'Document Collection', path: (isSuperHRPath ? '/super-hr/document-collection' : '/hr/document-collection'), icon: Upload },
    { title: 'Assign Leaves', path: (isSuperHRPath ? '/super-hr/assign-leaves' : '/hr/assign-leaves'), icon: CalendarCheck },
    { title: 'Company Policies', path: (isSuperHRPath ? '/super-hr/add-policies' : '/hr/add-policies'), icon: FileText },
  ];

  const MANAGEMENT_ANALYTICS = [
    { title: 'Dashboard', path: (isSuperHRPath ? '/super-hr/dashboard' : '/hr/dashboard'), icon: LayoutGrid },
    {
      title: 'Leave Management',
      icon: CalendarCheck,
      path: (isSuperHRPath ? '/super-hr/leave-requests' : '/hr/leave-requests'),
    },
    
    // { title: 'Expense Management', path: (isSuperHRPath ? '/super-hr/expense-management' : '/hr/expense-management'), icon: Coins },
    { title: 'Attendance', path: (isSuperHRPath ? '/super-hr/employees-attendance' : '/hr/employees-attendance'), icon: CalendarCheck },
    { title: 'Holidays', path: (isSuperHRPath ? '/super-hr/holidays' : '/hr/holidays'), icon: CalendarSearch },
    { title: 'View Projects', path: (isSuperHRPath ? '/super-hr/view-projects' : '/hr/view-projects'), icon: FileIcon },
    { title: 'Asset Allocations', path: (isSuperHRPath ? '/super-hr/asset-allocations' : '/hr/asset-allocations'), icon: Monitor },
    // New: My Activity tab (for both HR and Super-HR), and HR Config (only for Super HR)
    { title: 'My Activity', path: (isSuperHRPath ? '/super-hr/my-activity' : '/hr/my-activity'), icon: FileIcon },
    ...(isSuperHRPath ? [{ title: 'HR Config', path: '/super-hr/hr-config', icon: Settings }] : []),
  ];

  const GROUPS = [
    { label: 'EMPLOYEE OPERATIONS', items: EMPLOYEE_OPERATIONS },
    { label: 'MANAGEMENT & ANALYTICS', items: MANAGEMENT_ANALYTICS },
  ];

  // Admin grouped navbar using Admin menu config, EXACTLY two sections like HR
  const findAdminItem = (title) => MENU_SIDEBAR_ADMIN.find((i) => i.title === title);
  const ADMIN_EMPLOYEE_OPERATIONS = [
    findAdminItem('Employee Management'),
    findAdminItem('Onboarding Employees'),
    findAdminItem('Document Collection'),
    findAdminItem('Assign Leaves'),
    findAdminItem('Company Policies'),
  ].filter(Boolean);

  // Merge Admin’s management and IT items into a single second section
  const ADMIN_MANAGEMENT_ANALYTICS = [
    findAdminItem('Dashboard'),
    findAdminItem('Leave Requests'),
    findAdminItem('Expense Management'),
    findAdminItem('Employee Attendance'),
    findAdminItem('Holidays'),
    findAdminItem('View Projects'),
    // IT items appended to match two-section structure
    findAdminItem('Assets'),
    findAdminItem('Vendors'),
    findAdminItem('Allocations'),
    findAdminItem('Maintenance'),
    findAdminItem('Software Requests'),
    // Config last
    findAdminItem('HR Config'),
  ].filter(Boolean);

  const ADMIN_GROUPS = [
    { label: 'EMPLOYEE OPERATIONS', items: ADMIN_EMPLOYEE_OPERATIONS },
    { label: 'MANAGEMENT & ANALYTICS', items: ADMIN_MANAGEMENT_ANALYTICS },
  ];

  const renderSubNavbar = () => {
    if (!activeParent?.children?.length) return null;
    return (
      <div className="container-fluid">
        <div className="border-b border-border pb-2">
          <NavbarMenu items={activeParent.children} />
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Sidebar is removed for HR and other role layouts */}
      {showSidebar && <Sidebar menu={menu} />}

      <div className="wrapper flex grow flex-col">
        <Header menu={menu} />

        {/* HR/Super HR/Admin Top Navbar with labels */}
        {(isHR || isSuperHRPath || isAdmin) && (
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
            <Navbar>
              <div className="flex flex-col gap-1">
                {(isAdmin ? ADMIN_GROUPS : GROUPS).map((group, idx) => (
                  <div
                    key={idx}
                    className={`flex ${isAdmin ? 'flex-wrap gap-x-6 gap-y-2' : 'space-x-6 overflow-x-auto scrollbar-hide'} py-2 border-b border-gray-100 w-full`}
                  >
                    <div className="flex items-center">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {group.label}
                      </span>
                    </div>
                    <div className="flex-1">
                      <NavbarMenu
                        items={group.items}
                        onItemWithChildrenClick={(item) => setActiveParent(item)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Navbar>
          </div>
        )}

        {/* Non-HR roles top navbar: single line, no labels */}
        {!isHR && !isAdmin && (isEmployee || isIntern || isManager || isAccountManager || isITSupporter) && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Navbar>
              <div className="flex space-x-6 overflow-x-auto scrollbar-hide py-2 border-b border-gray-100 w-full">
                <div className="flex-1">
                  <NavbarMenu
                    items={menu}
                    onItemWithChildrenClick={(item) => setActiveParent(item)}
                  />
                </div>
              </div>
            </Navbar>
          </div>
        )}

        {/* Sub Navbar for children (e.g., Leave Management) */}
        {showTopNavbar && renderSubNavbar()}

        {/* Main content: remove extra left space for Admin */}
        <main className="grow pt-5 bg-gray-50" role="content">
          {showTopNavbar ? (
            <div className={`${isAdmin ? 'max-w-8xl mx-auto px-0 sm:px-0 lg:px-0' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
              <Outlet />
            </div>
          ) : (
            <Outlet />
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
