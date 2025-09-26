import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { UserDropdownMenu } from '@/components/layouts/layout-1/shared/topbar/user-dropdown-menu';
import '@/styles/employee-layout.css';

export function EmployeeLayout() {
  return (
    <>
      <Helmet>
        <title>Employee Portal</title>
      </Helmet>
      
      <div className="employee-layout">
        {/* Header - Full Width */}
        <header className="employee-header">
          <div className="employee-header-container">
            <div className="employee-header-content">
              {/* Logo - Non-collapsible */}
              <div className="flex items-center gap-2.5">
                <Link to="/" className="shrink-0 flex items-center gap-2">
                  <img
                    src={toAbsoluteUrl('/media/app/Nxzen.png')}
                    className="h-[25px] w-full"
                    alt="Nxzen Logo"
                  />
                  <span className="text-lg font-semibold text-gray-800 dark:text-white">Nxzen</span>
                </Link>
              </div>

              {/* Employee Portal Title */}
              <h1 className="text-xl font-semibold text-gray-900">Employee Portal</h1>

              {/* Profile - From Layout1 */}
              <div className="flex items-center">
                <UserDropdownMenu
                  trigger={
                    <img
                      className="size-9 rounded-full border-2 border-green-500 shrink-0 cursor-pointer"
                      src={toAbsoluteUrl('/media/avatars/300-2.png')}
                      alt="User Avatar"
                    />
                  }
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Full Width */}
        <main className="employee-main">
          <div className="employee-content-container">
            <Outlet />
          </div>
        </main>

        {/* Footer - Full Width */}
        <footer className="employee-footer">
          <div className="employee-footer-container">
            <div className="employee-footer-content">
              © 2024 Employee Portal. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}