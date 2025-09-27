import { LayoutGrid, DollarSign, Briefcase, KeyRound, CoinsIcon, Coins } from 'lucide-react';

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