import { LayoutGrid, ClipboardList, UserPlus, Users, Plane, DollarSign, KeyRound } from 'lucide-react';

export const MENU_SIDEBAR_MANAGER = [
  {
    title: 'Dashboard',
    icon: LayoutGrid,
    path: '/manager',
  },
  {
    title: 'Attendance',
    icon: ClipboardList,
    children: [
      {
        title: 'Add Attendance',
        icon: UserPlus,
        path: '/manager/add-attendance',
      },
      {
        title: 'Employee Attendance',
        icon: ClipboardList,
        path: '/manager/employees-attendance',
      },
    ],
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
    title: 'Change Password',
    icon: KeyRound,
    path: '/manager/change-password',
  },
];
