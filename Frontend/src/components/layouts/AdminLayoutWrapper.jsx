import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Header } from './layout-1/components/header';
import { MENU_SIDEBAR_ADMIN } from '@/config/admin-layout.config';
import { Navbar } from '@/components/layouts/layout-1/shared/navbar/navbar';
import { NavbarMenu } from '@/components/layouts/layout-1/shared/navbar/navbar-menu';
import {
  LayoutGrid,
  Users,
  UserPlus,
  DollarSign,
  FolderOpen,
  FileText,
  Calendar,
  ClipboardCheck,
  Briefcase,
  Package,
  Building2,
  ListChecks,
  Wrench,
  ClipboardList,
  Settings,
  CalendarDays,
  CoinsIcon,
  Coins,
} from 'lucide-react';

/**
 * Admin Layout Wrapper - Top navigation style aligned with Super HR
 * Uses the shared Navbar and NavbarMenu with labeled groups
 */
export function AdminLayoutWrapper() {
  const [activeParent, setActiveParent] = useState(null);

  // Grouped admin menu aligned to Super HR top nav style
  const HR_OPERATIONS = [
    { title: 'Employee Management', path: '/admin/employee-management', icon: Users },
    { title: 'Onboarding', path: '/admin/onboarding-employees', icon: UserPlus },
    { title: 'Document Collection', path: '/admin/document-collection', icon: FolderOpen },
    { title: 'Assign Leaves', path: '/admin/assign-leaves', icon: CalendarDays },
    { title: 'Company Policies', path: '/admin/add-policies', icon: FileText },
  ];

  const MANAGEMENT_ANALYTICS = [
    { title: 'Dashboard', path: '/admin/dashboard', icon: LayoutGrid },
    { title: 'Leave Requests', path: '/admin/leave-requests', icon: Calendar },
    { title: 'Expense Management', path: '/admin/expense-management', icon: Coins },
    { title: 'Employee Attendance', path: '/admin/employees-attendance', icon: ClipboardCheck },
    { title: 'Holidays', path: '/admin/holidays', icon: Calendar },
    { title: 'Projects', path: '/admin/view-projects', icon: Briefcase },
    { title: 'HR Config', path: '/admin/hr-config', icon: Settings },
  ];

  const IT_MANAGEMENT = [
    { title: 'Assets', path: '/admin/assets', icon: Package },
    { title: 'Vendors', path: '/admin/vendors', icon: Building2 },
    { title: 'Allocations', path: '/admin/allocations', icon: ListChecks },
    { title: 'Maintenance', path: '/admin/maintanance', icon: Wrench },
    { title: 'Software Requests', path: '/admin/software-requests', icon: ClipboardList },
  ];

  const GROUPS = [
    { label: 'HR OPERATIONS', items: HR_OPERATIONS },
    { label: 'MANAGEMENT & ANALYTICS', items: MANAGEMENT_ANALYTICS },
    { label: 'IT MANAGEMENT', items: IT_MANAGEMENT },
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
      <Helmet>
        <title>Admin Portal - HRMS</title>
      </Helmet>

      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Header with brand and actions */}
        <Header menu={MENU_SIDEBAR_ADMIN} />

        {/* Admin Top Navbar aligned with Super HR style */}
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <Navbar>
            <div className="flex flex-col gap-1">
              {GROUPS.map((group, idx) => (
                <div
                  key={idx}
                  className="flex space-x-6 overflow-x-auto scrollbar-hide py-2 border-b border-gray-100 w-full"
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

        {/* Sub Navbar for children (future-proof) */}
        {renderSubNavbar()}

        {/* Main Content Area */}
        <main className="flex-1 pt-5 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="container-fluid">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-600">
                © {new Date().getFullYear()} HRMS. All rights reserved.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Privacy Policy</a>
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Terms of Service</a>
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Support</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}