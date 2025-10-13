import { useMemo } from 'react';
import { Layout1 } from './layout-1';
import { MENU_SIDEBAR } from '@/config/layout-1.config';
import { useUser } from '@/contexts/UserContext';

/**
 * Wrapper component for HR layout that filters menu based on user permissions
 * Regular HRs cannot see "Onboarding Employees" menu item
 */
export function HRLayoutWrapper() {
  const { user } = useUser();
  const isSuperHR = user?.role === 'HR' && user?.super_hr === true;

  // Debug logging
  console.log('HRLayoutWrapper - User:', user);
  console.log('HRLayoutWrapper - isSuperHR:', isSuperHR);
  console.log('HRLayoutWrapper - user.super_hr:', user?.super_hr);

  // Filter menu based on super_hr status
  const filteredMenu = useMemo(() => {
    if (isSuperHR) {
      // Super-HR sees all menu items
      console.log('HRLayoutWrapper - Showing all menu items for Super-HR');
      return MENU_SIDEBAR;
    }

    // Regular HR: filter out "Onboarding Employees"
    console.log('HRLayoutWrapper - Filtering menu for Regular HR');
    return MENU_SIDEBAR.filter(item => 
      item.title !== 'Onboarding Employees'
    );
  }, [isSuperHR]);

  return <Layout1 menu={filteredMenu} />;
}

