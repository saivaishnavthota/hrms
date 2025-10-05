import { useState, useEffect } from 'react';
import {
  BetweenHorizontalStart,
  Coffee,
  CreditCard,
  FileText,
  Globe,
  IdCard,
  Moon,
  Settings,
  Shield,
  SquareCode,
  UserCircle,
  Users,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { logout } from '@/lib/auth';
import { useUser } from '@/contexts/UserContext';
import api from '@/lib/api';

const I18N_LANGUAGES = [
  {
    label: 'English',
    code: 'en',
    direction: 'ltr',
    flag: toAbsoluteUrl('/media/flags/united-states.svg'),
  },
  {
    label: 'Arabic (Saudi)',
    code: 'ar',
    direction: 'rtl',
    flag: toAbsoluteUrl('/media/flags/saudi-arabia.svg'),
  },
  {
    label: 'French',
    code: 'fr',
    direction: 'ltr',
    flag: toAbsoluteUrl('/media/flags/france.svg'),
  },
  {
    label: 'Chinese',
    code: 'zh',
    direction: 'ltr',
    flag: toAbsoluteUrl('/media/flags/china.svg'),
  },
];

export function UserDropdownMenu({ trigger }) {
  const { user } = useUser();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        // First, use UserContext data as fallback
        // Note: user.email already contains the company email from login response
        if (user) {
          setEmployee({
            name: user.name,
            email: user.email, // This is the company email
            company_email: user.email, // Same as email
            role: user.role,
            employeeId: user.employeeId
          });
        }

        // Try to fetch additional data from API
        const userId = user?.employeeId || localStorage.getItem('userId');
        if (userId) {
          const { data } = await api.get(`/users/${userId}`);
          console.log('User dropdown data:', data); // Debug log
          setEmployee({
            name: data.name || user?.name,
            email: data.company_email || data.email || user?.email,
            company_email: data.company_email || data.email || user?.email,
            role: data.role || user?.role,
            employeeId: data.id || user?.employeeId
          });
        }
      } catch (error) {
        console.error('Error fetching employee data:', error);
        // Keep using UserContext data if API fails
        if (user) {
          setEmployee({
            name: user.name,
            email: user.email,
            company_email: user.email,
            role: user.role,
            employeeId: user.employeeId
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [user]);
  const currenLanguage = I18N_LANGUAGES[0];
  const { theme, setTheme } = useTheme();

  const handleThemeToggle = (checked) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" side="bottom" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-full border-2 border-green-500 bg-gray-100 flex items-center justify-center">
              <UserCircle className="size-6 text-gray-600" />
            </div>

            <div className="flex flex-col">
              <Link
                to="#"
                className="text-sm text-mono hover:text-primary font-semibold"
              >
                {loading ? 'Loading...' : (employee ? `${employee.name}` : 'Employee')}
              </Link>
              <a
                href={`mailto:${employee?.company_email || employee?.email || 'employee@company.com'}`}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                {loading ? 'Loading...' : (employee?.company_email || employee?.email || 'No email')}
              </a>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Menu Items */}
        <DropdownMenuItem asChild>
          <Link to="/my-profile" className="flex items-center gap-2">
            <UserCircle />
            My Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <div className="p-2 mt-1">
          <Button variant="outline" size="sm" className="w-full" onClick={logout}>
            Logout
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
