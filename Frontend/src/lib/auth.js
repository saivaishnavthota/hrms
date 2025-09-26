// Authentication utility functions

/**
 * Check if user is authenticated
 * @returns {boolean} - True if user has valid auth token
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('authToken');
  return !!token;
};

/**
 * Get current user information from localStorage
 * @returns {Object|null} - User info object or null if not authenticated
 */
export const getCurrentUser = () => {
  const token = localStorage.getItem('authToken');
  const userType = localStorage.getItem('userType');
  const userId = localStorage.getItem('userId');
  
  if (!token) return null;
  
  return {
    token,
    userType,
    userId,
    isEmployee: userType === 'Employee',
    isHR: userType === 'Hr',
    isManager: userType === 'Manager'
  };
};

/**
 * Get user role
 * @returns {string|null} - User role or null if not authenticated
 */
export const getUserRole = () => {
  return localStorage.getItem('userType');
};

/**
 * Check if user has specific role
 * @param {string|string[]} roles - Role or array of roles to check
 * @returns {boolean} - True if user has one of the specified roles
 */
export const hasRole = (roles) => {
  const userRole = getUserRole();
  if (!userRole) return false;
  
  if (Array.isArray(roles)) {
    return roles.includes(userRole);
  }
  
  return userRole === roles;
};

/**
 * Logout user by clearing authentication data
 */
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userType');
  localStorage.removeItem('userId');
  
  // Redirect to login page
  window.location.href = '/login';
};

/**
 * Get redirect path based on user role
 * @param {string} userType - User role
 * @returns {string} - Redirect path
 */
export const getRedirectPath = (userType) => {
  switch (userType) {
    case 'Employee':
      return '/employee';
    case 'Hr':
        return '/hr/dashboard';
    case 'Manager':
      return '/hr/dashboard';
    default:
      return '/login';
  }
};