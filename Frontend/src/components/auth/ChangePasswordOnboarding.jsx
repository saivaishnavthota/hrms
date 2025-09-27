import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function ChangePasswordOnboarding() {
  const navigate = useNavigate();
  const { user, updateUser, getRedirectPath, needsOnboarding } = useUser();
  
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Redirect if user doesn't need password change
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.login_status) {
      // User already has changed password, redirect to appropriate page
      const redirectPath = getRedirectPath();
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate, getRedirectPath]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    setIsSubmitting(true);

    try {
      console.log('Attempting password change for user:', user);
      
      // Call the appropriate API based on user type
      let response;
      
      if (user.onboarding_status && !user.login_status) {
        // Onboarding complete but not yet logged in: no current password required
        console.log('Using change-password endpoint for onboarding_status=true and login_status=false');
        response = await authAPI.changePassword(
          user.email,
          passwordData.newPassword
        );
      } else if (user.onboarding_status) {
        // Onboarded and has login status: standard reset (backend may still validate)
        console.log('Using reset-password endpoint for onboarded user');
        response = await authAPI.resetPassword({
          email: user.email,
          new_password: passwordData.newPassword
        });
      } else {
        // For onboarding candidates - use reset-onboarding-password endpoint
        console.log('Using reset-onboarding-password endpoint for onboarding candidate');
        response = await authAPI.resetOnboardingPassword({
          employee_id: user.employeeId,
          new_password: passwordData.newPassword
        });
      }

      console.log('Password change response:', response);

      if (response && response.status === 'success') {
        // Update user login status
        updateUser({ login_status: true });
        
        setIsSuccess(true);
        setMessage('Password updated successfully! Please use your new password for future logins.');
        
        // Reset form after success
        setTimeout(() => {
          setPasswordData({
            newPassword: '',
            confirmPassword: ''
          });
          setMessage('');
        }, 3000);
        
        // Redirect after 2 seconds
        setTimeout(() => {
          // Get redirect path based on updated user status
          const redirectPath = getRedirectPath();
          navigate(redirectPath, { replace: true });
        }, 2000);
      } else {
        // Handle unexpected response format
        const errorMessage = response?.message || 'Failed to change password. Please try again.';
        setMessage(errorMessage);
      }
    } catch (error) {
      console.error('Password change error:', error);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const errorData = error.response.data;
        
        if (status === 400) {
          // Bad request - validation errors
          if (errorData.detail && typeof errorData.detail === 'string') {
            setMessage(errorData.detail);
          } else if (errorData.message) {
            setMessage(errorData.message);
          } else {
            setMessage('Invalid request. Please check your input.');
          }
        } else if (status === 401) {
          // Unauthorized - wrong current password
          setMessage('Current password is incorrect.');
        } else if (status === 404) {
          // User not found
          setMessage('User not found. Please contact support.');
        } else if (status === 422) {
          // Validation error
          setMessage('Password validation failed. Please check requirements.');
        } else if (status >= 500) {
          // Server error
          setMessage('Server error. Please try again later.');
        } else {
          // Other errors
          setMessage(errorData.message || 'An unexpected error occurred.');
        }
      } else if (error.request) {
        // Network error
        setMessage('Network error. Please check your connection and try again.');
      } else {
        // Other errors
        setMessage('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/50 w-full max-w-md">
        <div className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-500/20 rounded-full">
                <Shield className="h-8 w-8 text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">Change Password</h2>
            <p className="text-slate-400">Please set a new password to continue</p>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('success') 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {message.includes('success') ? (
                <CheckCircle className="h-4 w-4 inline mr-2" />
              ) : (
                <AlertCircle className="h-4 w-4 inline mr-2" />
              )}
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* New Password */}
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handleInputChange}
                  placeholder="Enter your new password"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-12 py-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200"
                  disabled={isSubmitting}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your new password"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-12 py-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200"
                  disabled={isSubmitting}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Removed client-side mismatch validation message */}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setPasswordData({
                    newPassword: '',
                    confirmPassword: ''
                  });
                  setMessage('');
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500/50"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Changing...</span>
                  </div>
                ) : (
                  'Change Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}