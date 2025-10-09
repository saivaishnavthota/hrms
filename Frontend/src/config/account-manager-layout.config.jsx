import { LayoutGrid, DollarSign, Briefcase, KeyRound, ClipboardList, Plane, Upload } from 'lucide-react';

export const MENU_SIDEBAR_ACCOUNT_MANAGER = [
  {
    title: 'Dashboard',
    icon: LayoutGrid,
    path: '/account-manager',
  },
  {
    title: 'Expense Management',
    icon: DollarSign,
    path: '/account-manager/expense-management',
  },
  {
    title: 'Upload Documents',
    icon: Upload,
    path: '/account-manager/upload-documents',
  },
  {
    title: 'Add Attendance',
    icon: ClipboardList,
    path: '/account-manager/add-attendance',
  },
  {
    title: 'Apply Leave',
    icon: Plane,
    path: '/account-manager/apply-leave',
  },
  {
    title: 'Projects',
    icon: Briefcase,
    path: '/account-manager/projects',
  },
  {
    title: 'Change Password',
    icon: KeyRound,
    path: '/account-manager/change-password',
  },
];