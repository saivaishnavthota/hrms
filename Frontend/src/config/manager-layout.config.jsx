import { LayoutGrid, ClipboardList, UserPlus, Users, Plane, DollarSign, KeyRound, Upload } from 'lucide-react';

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
    icon: Plane,
    children: [
      {
        title: 'Apply Leave',
        icon: Plane,
        path: '/manager/apply-leave',
      },
      {
        title: 'Leave Requests',
        icon: ClipboardList,
        path: '/manager/leave-requests',
      },
    ],
  },
  {
    title: 'Expense Management',
    icon: DollarSign,
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
