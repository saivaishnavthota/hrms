import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useMenu } from '@/hooks/use-menu';
import {
  Menubar,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from '@/components/ui/menubar';

const NavbarMenu = ({ items, onItemWithChildrenClick = () => {} }) => {
  const { pathname } = useLocation();
  const { isActive, hasActiveChild } = useMenu(pathname);

  const buildRow = (rowItems, isFirstRow = false) => {
    return (
      <Menubar className="flex w-full justify-center flex-nowrap items-center gap-4 border-none bg-transparent p-0 h-auto">
        {rowItems.map((item, index) => {
          const active = isActive(item.path) || hasActiveChild(item.children);
          // remove defaultActive behavior across groups; only highlight real active items

          if (item.children) {
            return (
              <MenubarMenu key={index}>
                <MenubarTrigger
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-3.5 text-sm text-gray-400',
                    'rounded-none border-b-[2px] border-transparent bg-transparent!',
                    'hover:text-blue-600 hover:bg-transparent',
                    'focus-visible:text-gray-400 focus-visible:bg-transparent',
                    'data-[state=open]:text-gray-400 data-[state=open]:bg-transparent',
                    'data-[active=true]:text-blue-600 data-[active=true]:border-blue-600',
                  )}
                  data-active={active || undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    onItemWithChildrenClick(item);
                  }}
                >
                  {item.icon && <item.icon className="size-4 text-current" />}
                  <span>{item.title}</span>
                </MenubarTrigger>
              </MenubarMenu>
            );
          } else {
            return (
              <MenubarMenu key={index}>
                <MenubarTrigger
                  asChild
                  className={cn(
                    'flex items-center py-3.5 text-sm text-gray-400 px-3 gap-1.5',
                    'rounded-none border-b-[2px] border-transparent bg-transparent!',
                    'hover:text-blue-600 hover:bg-transparent',
                    'focus-visible:text-gray-400 focus-visible:bg-transparent',
                    'data-[state=open]:text-gray-400 data-[state=open]:bg-transparent',
                    'data-[active=true]:text-blue-600 data-[active=true]:border-blue-600',
                  )}
                >
                  <Link
                    to={item.path || ''}
                    data-active={active || undefined}
                    className="flex items-center gap-1.5 text-gray-400 hover:text-blue-600 focus-visible:text-gray-400"
                  >
                    {item.icon && <item.icon className="size-4 text-current" />}
                    <span>{item.title}</span>
                  </Link>
                </MenubarTrigger>
              </MenubarMenu>
            );
          }
        })}
      </Menubar>
    );
  };

  // Single row per group (no internal second row)
  return (
    <div className="kt-scrollable-x-auto">
      {buildRow(items || [], true)}
    </div>
  );
};

export { NavbarMenu };
