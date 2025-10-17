import React from 'react';
import { Building2, User, FileText, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
export default function OnboardingHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useUser();

  // Show loading state while user context is initializing
  if (isLoading) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <img 
                  src="/media/images/Nxzen logo.jpg" 
                  alt="Nxzen Logo" 
                  className="h-10 w-auto object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-black to-black bg-clip-text text-transparent">
                  Employee Onboarding Portal
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  const handleLogout = () => {
    // Clear any stored authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Redirect to login page
    navigate('/login');
  };


 

  // Determine which step is active based on current route
  const isPersonalDetailsActive = location.pathname === '/onboarding' || location.pathname === '/onboarding/details' || location.pathname === '/new-user-details';
  const isDocumentUploadActive = location.pathname === '/upload-documents';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Company Name */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <img 
                src="/media/images/Nxzen logo.jpg" 
                alt="Nxzen Logo" 
                className="h-10 w-auto object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Employee Onboarding Portal
              </h1>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isPersonalDetailsActive 
                  ? 'bg-blue-100' 
                  : 'bg-green-100'
              }`}>
                <User className={`w-4 h-4 ${
                  isPersonalDetailsActive 
                    ? 'text-blue-600' 
                    : 'text-green-600'
                }`} />
              </div>
              <span className={`text-sm font-medium ${
                isPersonalDetailsActive 
                  ? 'text-gray-700' 
                  : 'text-green-600'
              }`}>Personal Details</span>
            </div>
            
            <div className={`w-8 h-0.5 ${
              isDocumentUploadActive 
                ? 'bg-blue-300' 
                : 'bg-gray-300'
            }`}></div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isDocumentUploadActive 
                  ? 'bg-blue-100' 
                  : 'bg-gray-100'
              }`}>
                <FileText className={`w-4 h-4 ${
                  isDocumentUploadActive 
                    ? 'text-blue-600' 
                    : 'text-gray-400'
                }`} />
              </div>
              <span className={`text-sm font-medium ${
                isDocumentUploadActive 
                  ? 'text-gray-700' 
                  : 'text-gray-500'
              }`}>Document Upload</span>
            </div>
          </div>

          {/* User Info and Logout */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 flex items-center space-x-1"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}