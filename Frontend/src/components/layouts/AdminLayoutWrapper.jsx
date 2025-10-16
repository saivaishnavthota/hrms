import React from 'react';
import { Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Header } from './layout-1/components/header';
import { MENU_SIDEBAR_ADMIN } from '@/config/admin-layout.config';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * Admin Layout Wrapper - Top navigation style (no sidebar)
 * Uses horizontal menu navigation similar to Super-HR portal
 */
export function AdminLayoutWrapper() {
  const location = useLocation();

  return (
    <>
      <Helmet>
        <title>Admin Portal - HRMS</title>
      </Helmet>

      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Header with brand and actions */}
        <Header menu={MENU_SIDEBAR_ADMIN} />

        {/* Horizontal Navigation Menu */}
        <nav className="sticky top-[64px] z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="container-fluid">
            <div className="flex items-center gap-1 overflow-x-auto py-2">
              {MENU_SIDEBAR_ADMIN.map((item) => {
                const isActive = location.pathname === item.path || 
                                 (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1">
          <div className="container-fluid py-6">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="container-fluid">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-600">
                © {new Date().getFullYear()} HRMS. All rights reserved.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Privacy Policy</a>
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Terms of Service</a>
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Support</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

