import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { logout } from '@/lib/auth';
import { User as UserIcon, LogOut as LogOutIcon } from 'lucide-react';
import CompanyPoliciesModal from '@/components/shared/CompanyPoliciesModal';
import '@/styles/employee-layout.css';

export function EmployeeLayout() {
  const [isPoliciesModalOpen, setIsPoliciesModalOpen] = useState(false);

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
                <Link to="/employee" className="shrink-0 flex items-center gap-2">
                  <img
                    src={toAbsoluteUrl('/media/app/Nxzen.png')}
                    className="h-[25px] w-full"
                    alt="Nxzen Logo"
                  />
                  <span className="text-lg font-semibold text-gray-800 dark:text-white">Nxzen</span>
                </Link>
              </div>

              {/* Employee Portal Title with divider */}
              <div className="hidden sm:flex items-center gap-3">
                <span className="h-6 w-px bg-gray-300" />
                <span className="employee-header-title">Employee Portal</span>
              </div>

              {/* Right actions: Profile and Logout */}
              <div className="employee-header-actions">
                <Link to="/my-profile" className="employee-header-action" aria-label="Profile">
                  <UserIcon className="icon" />
                  <span>Profile</span>
                </Link>
                <button onClick={logout} className="employee-header-action" aria-label="Logout">
                  <LogOutIcon className="icon" />
                  <span>Logout</span>
                </button>
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
              <span>© 2025 Employee Portal. All rights reserved.</span>
              <span className="mx-2">•</span>
              <button 
                onClick={() => setIsPoliciesModalOpen(true)}
                className="text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Company Policies
              </button>
            </div>
          </div>
        </footer>
      </div>

      <CompanyPoliciesModal 
        isOpen={isPoliciesModalOpen} 
        onClose={() => setIsPoliciesModalOpen(false)} 
      />
    </>
  );
}