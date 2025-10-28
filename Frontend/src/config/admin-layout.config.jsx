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
  Shield,
  CalendarDays
} from 'lucide-react';

export const MENU_SIDEBAR_ADMIN = [
  {
    title: 'Home',
    icon: LayoutGrid,
    path: '/admin/dashboard',
  },
  // HR Management Section
  {
    title: 'Employee Management',
    icon: Users,
    path: '/admin/employee-management',
  },
  {
    title: 'Onboarding Employees',
    icon: UserPlus,
    path: '/admin/onboarding-employees',
  },
  {
    title: 'Employee Attendance',
    icon: ClipboardCheck,
    path: '/admin/employees-attendance',
  },
  {
    title: 'Leave Requests',
    icon: Calendar,
    path: '/admin/leave-requests',
  },
  {
    title: 'Assign Leaves',
    icon: CalendarDays,
    path: '/admin/assign-leaves',
  },
  {
    title: 'Expense Management',
    icon: DollarSign,
    path: '/admin/expense-management',
  },
  {
    title: 'Document Collection',
    icon: FolderOpen,
    path: '/admin/document-collection',
  },
  {
    title: 'View Projects',
    icon: Briefcase,
    path: '/admin/view-projects',
  },
  {
    title: 'Holidays',
    icon: Calendar,
    path: '/admin/holidays',
  },
  {
    title: 'Company Policies',
    icon: FileText,
    path: '/admin/add-policies',
  },
  // IT Management Section
  {
    title: 'Assets',
    icon: Package,
    path: '/admin/assets',
  },
  {
    title: 'Vendors',
    icon: Building2,
    path: '/admin/vendors',
  },
  {
    title: 'Allocations',
    icon: ListChecks,
    path: '/admin/allocations',
  },
  {
    title: 'Maintenance',
    icon: Wrench,
    path: '/admin/maintanance',
  },
  {
    title: 'Software Requests',
    icon: ClipboardList,
    path: '/admin/software-requests',
  },
  {
    title: 'Project Allocations',
    icon: Briefcase,
    path: '/admin/project-allocations',
  },
  // Configuration Section
  {
    title: 'HR Config',
    icon: Settings,
    path: '/admin/hr-config',
  },
];

