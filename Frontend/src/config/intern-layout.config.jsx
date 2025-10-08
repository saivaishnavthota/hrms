import { LayoutGrid, ClipboardList, Plane, Upload, DollarSign, KeyRound } from 'lucide-react';

export const MENU_SIDEBAR_INTERN = [
  {
    title: 'Dashboard',
    icon: LayoutGrid,
    path: '/intern',
  },
  {
    title: 'Add Attendance',
    icon: ClipboardList,
    path: '/intern/add-attendance',
  },
  {
    title: 'Apply Leave',
    icon: Plane,
    path: '/intern/apply-leave',
  },
  {
    title: 'Upload Documents',
    icon: Upload,
    path: '/intern/upload-documents',
  },
  {
    title: 'Submit Expense',
    icon: DollarSign,
    path: '/intern/submit-expense',
  },
  {
    title: 'Set Password',
    icon: KeyRound,
    path: '/intern/set-password',
  },
];

