import { useEffect, useState } from 'react';
import { Menu, UserCircle } from 'lucide-react';
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

import { UserDropdownMenu } from '@/components/layouts/layout-1/shared/topbar/user-dropdown-menu';
// Removed MegaMenu and MegaMenuMobile imports as they are no longer used
import { SidebarMenu } from './sidebar-menu';

export function Header({ menu }) {
  const [isSidebarSheetOpen, setIsSidebarSheetOpen] = useState(false);

  const { pathname } = useLocation();
  const mobileMode = useIsMobile();
  const { user } = useUser();

  const scrollPosition = useScrollPosition();
  const headerSticky = scrollPosition > 0;

  // Close sheet when route changes
  useEffect(() => {
    setIsSidebarSheetOpen(false);
  }, [pathname]);

  const getPortalLabel = (path) => {
    if (!path) return 'Portal';
    if (path.startsWith('/manager')) return 'Manager Portal';
    if (path.startsWith('/account-manager')) return 'Account Manager Portal';
    if (path.startsWith('/employee')) return 'Employee Portal';
    if (path.startsWith('/hr')) return 'HR Portal';

    if (path.startsWith('/intern')) return 'Intern Portal';
    return 'Portal';
  };

  return (
    <header
      className={cn(
        'header fixed top-0 z-10 start-0 flex items-stretch shrink-0 border-b border-transparent bg-background end-0 pe-[var(--removed-body-scroll-bar-size,0px)]',
        headerSticky && 'border-b border-border',
      )}
    >
      <div className="container-fluid flex justify-between items-stretch lg:gap-4">
        {/* HeaderLogo */}
        <div className="flex lg:hidden items-center gap-2.5">
          <Link to="/" className="shrink-0 flex items-center gap-2">
            <img
              src={toAbsoluteUrl('/media/app/Nxzen.png')}
              className="h-[25px] w-full"
              alt="Nxzen Logo"
            />
            <span className="text-lg font-semibold text-gray-800 dark:text-white">Nxzen</span>
          </Link>
          <div className="flex items-center">
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
            {/* Mobile mega menu removed as requested */}
          </div>
        </div>

        {/* Centered Welcome Message */}
        <div className="hidden lg:flex items-center justify-center flex-1">
          <h1 className="text-2xl font-semibold text-gray-900 text-center ">
            {`Welcome to ${getPortalLabel(pathname)} `}
          </h1>
        </div>

        {/* Centered Welcome Message (Mobile) */}
        <div className="flex lg:hidden items-center justify-center flex-1">
          <h1 className="text-sm font-semibold text-gray-900 text-center">
            {`Welcome to ${getPortalLabel(pathname)} - ${user?.name || ''}`}
          </h1>
        </div>

        {/* Mega Menu - Removed as requested, keeping only profile */}
      
        {/* HeaderTopbar - Only Profile - Moved to extreme right */}
        <div className="flex items-center justify-end flex-1">
          <UserDropdownMenu
            trigger={
              <div className="size-9 rounded-full border-2 border-green-500 shrink-0 cursor-pointer bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <UserCircle className="size-6 text-gray-600" />
              </div>
            }
          />
        </div>
      </div>
    </header>
  );
}
