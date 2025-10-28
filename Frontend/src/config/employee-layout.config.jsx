import { LayoutGrid, ClipboardList, Plane, Upload, DollarSign, KeyRound,CalendarCheck,Coins, Clock } from 'lucide-react';

export const MENU_SIDEBAR_EMPLOYEE = [
  {
    title: 'Home',
    icon: LayoutGrid,
    path: '/employee',
  },
  {
    title: 'Time Management',
    icon: Clock,
    path: '/employee/time-management',
  },
  {
    title: 'Upload Documents',
    icon: Upload,
    path: '/employee/upload-documents',
  },
  // {
  //   title: 'Submit Expense',
  //   icon: Coins,
  //   path: '/employee/submit-expense',
  // },
   {
    title: 'Software Requests',
    icon: ClipboardList, 
    path: '/employee/software-requests',
  },
 
];