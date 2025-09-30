import { ChevronFirst } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLayout } from './context';

export function SidebarHeader() {
  const { sidebarCollapse, setSidebarCollapse } = useLayout();

  const handleToggleClick = () => {
    setSidebarCollapse(!sidebarCollapse);
  };

  return (
    <div className="sidebar-header hidden lg:flex items-center relative justify-between px-3 lg:px-6 shrink-0">
      <Link to="/hr/dashboard">
        <div className="dark:hidden flex items-center gap-2">
          <img
            src={toAbsoluteUrl('/media/app/NxzenLogo.png')}
            className="default-logo h-[40px] max-w-[200px] rounded-tl-lg rounded-br-lg object-cover w-40 h-40"
            alt="Nxzen Logo"
          />
         
          <img
            src={toAbsoluteUrl('/media/app/Nxzen.png')}
            className="small-logo h-[40px] max-w-[50px] rounded-tl-lg rounded-br-lg object-cover w-40 h-40"
            alt="Nxzen Mini Logo"
          />
        </div>
       
      </Link>
      <Button
        onClick={handleToggleClick}
        size="sm"
        mode="icon"
        variant="outline"
        className={cn(
          'size-7 absolute start-full top-2/4 rtl:translate-x-2/4 -translate-x-2/4 -translate-y-2/4',
          sidebarCollapse ? 'ltr:rotate-180' : 'rtl:rotate-180',
        )}
      >
        <ChevronFirst className="size-4!" />
      </Button>
    </div>
  );
}
