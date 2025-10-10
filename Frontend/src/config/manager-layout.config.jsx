import { LayoutGrid, ClipboardList, UserPlus, Users, Plane, DollarSign, KeyRound, Upload ,CalendarCheck ,Coins} from 'lucide-react';

export const MENU_SIDEBAR_MANAGER = [
  {
    title: 'Dashboard',
    icon: LayoutGrid,
    path: '/manager',
  },
  {
    title: 'Attendance',
    icon: ClipboardList,
    path: '/manager/attendance',
  },
  {
    title: 'Employees',
    icon: Users,
    path: '/manager/employees',
  },
  {
    title: 'Leave Management',
    icon: CalendarCheck,
    path: '/manager/leave-management',
  },
  {
    title: 'Expense Management',
    icon: Coins,
    path: '/manager/expense-management',
  },
  {
    title: 'Upload Documents',
    icon: Upload,
    path: '/manager/upload-documents',
  },
  {
    title: 'Change Password',
    icon: KeyRound,
    path: '/manager/change-password',
  },
];
