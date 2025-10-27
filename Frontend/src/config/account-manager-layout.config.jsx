import { LayoutGrid, Briefcase, ClipboardList, Upload, CalendarCheck, BarChart3 } from 'lucide-react';

export const MENU_SIDEBAR_ACCOUNT_MANAGER = [
  {
    title: 'Dashboard',
    icon: LayoutGrid,
    path: '/account-manager',
  },
  // {
  //   title: 'Expense Management',
  //   icon: Coins,
  //   path: '/account-manager/expense-management',
  // },
  {
    title: 'Upload Documents',
    icon: Upload,
    path: '/account-manager/upload-documents',
  },
  {
    title: 'Book Your Time',
    icon: ClipboardList,
    path: '/account-manager/add-attendance',
  },
  {
    title: 'Apply Leave',
    icon: CalendarCheck,
    path: '/account-manager/apply-leave',
  },
  {
    title: 'Projects',
    icon: Briefcase,
    path: '/account-manager/projects',
  },
  {
    title: 'Project Allocations',
    icon: Briefcase,
    path: '/account-manager/project-allocations',
  },
  {
    title: 'Employee Allocations',
    icon: BarChart3,
    path: '/account-manager/employee-allocation-dashboard',
  },
 
];