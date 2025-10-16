import { LayoutGrid, ClipboardList, Plane, Upload, DollarSign, KeyRound,CalendarCheck,Coins } from 'lucide-react';

export const MENU_SIDEBAR_EMPLOYEE = [
  {
    title: 'Dashboard',
    icon: LayoutGrid,
    path: '/employee',
  },
  {
    title: 'Add Attendance',
    icon: ClipboardList,
    path: '/employee/add-attendance',
  },
  {
    title: 'Apply Leave',
    icon: CalendarCheck,
    path: '/employee/apply-leave',
  },
  {
    title: 'Upload Documents',
    icon: Upload,
    path: '/employee/upload-documents',
  },
  {
    title: 'Submit Expense',
    icon: Coins,
    path: '/employee/submit-expense',
  },
   {
    title: 'Software Requests',
    icon: ClipboardList, 
    path: '/employee/software-requests',
  },
  {
    title: 'Set Password',
    icon: KeyRound,
    path: '/employee/set-password',
  },
];