import { LayoutGrid, ClipboardList, UserPlus, Users, Plane, DollarSign, KeyRound, Upload ,CalendarCheck ,Coins, Monitor, BarChart3} from 'lucide-react';

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
    title: 'Employee Allocations',
    icon: BarChart3,
    path: '/manager/employee-allocation-dashboard',
  },
  {
    title: 'Leave Management',
    icon: CalendarCheck,
    path: '/manager/leave-management',
  },
  // {
  //   title: 'Expense Management',
  //   icon: Coins,
  //   path: '/manager/expense-management',
  // },
  {
    title: 'Upload Documents',
    icon: Upload,
    path: '/manager/upload-documents',
  },
   {
    title: 'Software Requests',
    icon: Monitor,
    path: '/manager/software-requests',
  },
 
];
