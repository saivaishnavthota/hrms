import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize user from localStorage on app start
  useEffect(() => {
    const initializeUser = () => {
      try {
        const storedUser = localStorage.getItem('userData');
        const authToken = localStorage.getItem('authToken');
        
        if (storedUser && authToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error initializing user:', error);
        // Clear corrupted data
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, []);

  // Store user data from login response
  const loginUser = (loginResponse) => {
    try {
      console.log('loginUser called with:', loginResponse);
      
      const userData = {
        employeeId: loginResponse.employeeId,
        name: loginResponse.name,
        role: loginResponse.role,
        email: loginResponse.email,
        onboarding_status: loginResponse.onboarding_status,
        login_status: loginResponse.login_status,
        access_token: loginResponse.access_token,
        type: loginResponse.type,
        message: loginResponse.message,
        location_id: loginResponse.location_id || null
      };

      console.log('Processed userData:', userData);
      setUser(userData);
      
      // Store in localStorage
      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.setItem('authToken', loginResponse.access_token);
      
      // Legacy storage for backward compatibility
      localStorage.setItem('userType', loginResponse.type);
      localStorage.setItem('userId', loginResponse.employeeId.toString());
      
      console.log('User data stored successfully');
    } catch (error) {
      console.error('Error in loginUser:', error);
      throw error; // Re-throw to be caught by the login handler
    }
  };

  // Logout user
  const logoutUser = () => {
    setUser(null);
    
    // Clear all stored data
    localStorage.removeItem('userData');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userId');
  };

  // Update user data (for password changes, etc.)
  const updateUser = (updates) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('userData', JSON.stringify(updatedUser));
  };

  // Check authentication status
  const isAuthenticated = () => {
    return !!(user && user.access_token);
  };

  // Get redirect path based on onboarding_status and login_status
  const getRedirectPath = () => {
    if (!user) return '/login';

    const { onboarding_status, login_status, role } = user;

    // Case 1: onboarding false, login_status false -> change password -> new user details
    if (!onboarding_status && !login_status) {
      return '/change-password-onboarding';
    }

    // Case 2: onboarding false, login_status true -> new user details
    if (!onboarding_status && login_status) {
      return '/new-user-details';
    }

    // Case 3: onboarding true, login_status false -> change password -> dashboard
    if (onboarding_status && !login_status) {
      return '/change-password-onboarding';
    }

    // Case 4: onboarding true, login_status true -> dashboard based on role
    if (onboarding_status && login_status) {
      return getDashboardPath(role);
    }

    return '/login';
  };

  // Get dashboard path based on role
  const getDashboardPath = (role) => {
    switch (role?.toLowerCase()) {
      case 'employee':
        return '/employee';
      case 'hr':
        return '/hr/dashboard';
      case 'account manager':
        return '/account-manager';
      case 'manager':
        return '/manager';
      default:
        return '/hr/dashboard';
    }
  };

  // Check if user needs password change
  const needsPasswordChange = () => {
    if (!user) return false;
    return !user.login_status;
  };

  // Check if user needs onboarding
  const needsOnboarding = () => {
    if (!user) return false;
    return !user.onboarding_status;
  };

  const value = {
    user,
    isLoading,
    loginUser,
    logoutUser,
    updateUser,
    isAuthenticated,
    getRedirectPath,
    getDashboardPath,
    needsPasswordChange,
    needsOnboarding
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};