import { useEffect, useState } from 'react';
import { Menu, User, LogOut } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet';

import { logout } from '@/lib/auth';
// Removed UserDropdownMenu in favor of explicit Profile/Logout buttons
import { SidebarMenu } from './sidebar-menu';

export function Header({ menu }) {
  const [isSidebarSheetOpen, setIsSidebarSheetOpen] = useState(false);

  const { pathname } = useLocation();
  const mobileMode = useIsMobile();
  const { user } = useUser();

  const scrollPosition = useScrollPosition();
  const headerSticky = scrollPosition > 0;

  // Role-based heading text based on current route
  const isHR = pathname.startsWith('/hr');
  const isSuperHR = pathname.startsWith('/super-hr');
  const isEmployee = pathname.startsWith('/employee');
  const isIntern = pathname.startsWith('/intern');
  const isManager = pathname.startsWith('/manager');
  const isAccountManager = pathname.startsWith('/account-manager');

  const headingText = isEmployee
    ? 'Welcome to Employee Portal'
    : isIntern
    ? 'Welcome to Intern Portal'
    : isManager
    ? 'Welcome to Manager Portal'
    : isAccountManager
    ? 'Welcome to Account Manager Portal'
    : isSuperHR
    ? 'Welcome to Super HR Portal'
    : isHR
    ? 'Welcome to HR Portal'
    : 'Welcome to Nxzen Portal';

  // Close sheet when route changes
  useEffect(() => {
    setIsSidebarSheetOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'header fixed top-0 z-10 start-0 flex items-stretch shrink-0 border-b bg-white shadow-sm end-0 pe-[var(--removed-body-scroll-bar-size,0px)]',
        'border-border',
      )}
    >
      <div className="container-fluid flex justify-between items-stretch lg:gap-4">
        {/* Left: Brand + Title */}
        <div className="flex items-center gap-4">
          <Link to="/" className="shrink-0 flex items-center gap-2">
            <img
              src={toAbsoluteUrl('/media/images/Nxzen_logo.jpg')}
              className="h-[32px] w-auto"
              alt="Nxzen Logo"
            />
            <span className="text-xl font-semibold text-gray-800 lowercase">nxzen</span>
          </Link>
          <span className="h-6 w-px bg-border" />
          <h1 className="text-lg font-semibold text-gray-900">
            {headingText}
          </h1>
        </div>

        {/* Mobile Menu Trigger (kept for non-HR layouts) */}
        <div className="flex lg:hidden items-center">
          {mobileMode && (
            <Sheet
              open={isSidebarSheetOpen}
              onOpenChange={setIsSidebarSheetOpen}
            >
              <SheetTrigger asChild>
                <Button variant="ghost" mode="icon">
                  <Menu className="text-muted-foreground/70" />
                </Button>
              </SheetTrigger>
              <SheetContent
                className="p-0 gap-0 w-[275px]"
                side="left"
                close={false}
              >
                <SheetHeader className="p-0 space-y-0" />
                <SheetBody className="p-0 overflow-y-auto">
                  <SidebarMenu menu={menu} />
                </SheetBody>
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* Right: Profile & Logout buttons */}
        <div className="hidden lg:flex items-center justify-end gap-3">
          <Link to="/my-profile">
            <Button variant="outline" size="md" className="gap-2 bg-brand text-brand-foreground hover:bg-brand/90 border-none">
              <User className="size-5" />
              Profile
            </Button>
          </Link>
          <Button variant="outline" size="md" className="gap-2 bg-brand text-brand-foreground hover:bg-brand/90 border-none" onClick={logout}>
            <LogOut className="size-5" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
