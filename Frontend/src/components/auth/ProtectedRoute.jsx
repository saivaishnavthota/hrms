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
  const normalize = (s) => (s || '').toLowerCase().replace(/[^a-z]/g, '');
  const normalizedAllowed = allowedRoles.map(r => normalize(r));
  const normalizedUserRole = normalize(userRole);

  // If specific roles are required, check if user has the right role (case-insensitive)
  if (normalizedAllowed.length > 0 && !normalizedAllowed.includes(normalizedUserRole)) {
    // Redirect to appropriate dashboard based on user role
    const redirectPath = getRedirectPath(userRole);
    return <Navigate to={redirectPath} replace />;
  }
  
  return children;
};

export default ProtectedRoute;