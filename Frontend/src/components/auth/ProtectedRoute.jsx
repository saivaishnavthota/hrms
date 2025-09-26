import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getUserRole, getRedirectPath } from '@/lib/auth';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation();
  
  // Check if user is authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  const userRole = getUserRole();
  
  // If specific roles are required, check if user has the right role
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on user role
    const redirectPath = getRedirectPath(userRole);
    return <Navigate to={redirectPath} replace />;
  }
  
  return children;
};

export default ProtectedRoute;