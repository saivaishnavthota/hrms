import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';

export default function Login() {
  const navigate = useNavigate();
  const { loginUser, getRedirectPath } = useUser();
  
  // Helper function to calculate redirect path from login response
  const calculateRedirectPath = (onboarding_status, login_status, role) => {
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

  // Helper function to get dashboard path based on role
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
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [showResetCodeForm, setShowResetCodeForm] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [resetCodeLoading, setResetCodeLoading] = useState(false);
  const [resetCodeMessage, setResetCodeMessage] = useState('');
  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordMessage, setResetPasswordMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      console.log('Attempting login with:', { email: formData.email });
      
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password
      });
      
      console.log('Login API response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));
      
      // Check if response is valid
      if (!response) {
        throw new Error('Empty response from server');
      }
      
      // Store user data in context and localStorage
      console.log('Calling loginUser with response:', response);
      loginUser(response);
      
      // Calculate redirect path directly from response data since state update is async
      const redirectPath = calculateRedirectPath(response.onboarding_status, response.login_status, response.type);
      console.log('Calculated redirect path:', redirectPath);
      
      // Navigate to the appropriate page
      navigate(redirectPath, { replace: true });
      
    } catch (error) {
      console.error('Login error details:', {
        error,
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      
      if (error.response?.data?.detail) {
        setErrors({ general: error.response.data.detail });
      } else if (error.response?.status === 401) {
        setErrors({ general: 'Invalid email or password' });
      } else if (error.response?.status === 422) {
        setErrors({ general: 'Please check your email and password format' });
      } else {
        setErrors({ general: 'Login failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail) {
      setForgotPasswordMessage('Please enter your email address');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(forgotPasswordEmail)) {
      setForgotPasswordMessage('Please enter a valid email address');
      return;
    }
    
    setForgotPasswordLoading(true);
    setForgotPasswordMessage('');
    
    try {
      const response = await authAPI.forgotPassword(forgotPasswordEmail);
      
      if (response.success || response.message) {
        setForgotPasswordMessage('Password reset code has been sent to your email');
        setShowResetCodeForm(true);
        console.log('Password reset requested for:', forgotPasswordEmail);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      
      if (error.response?.data?.detail) {
        setForgotPasswordMessage(error.response.data.detail);
      } else if (error.response?.status === 404) {
        setForgotPasswordMessage('Email address not found');
      } else {
        setForgotPasswordMessage('Failed to send reset code. Please try again.');
      }
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResetCodeSubmit = async (e) => {
    e.preventDefault();
    
    if (!resetCode) {
      setResetCodeMessage('Please enter the reset code');
      return;
    }
    
    if (resetCode.length !== 6) {
      setResetCodeMessage('Reset code must be 6 digits');
      return;
    }
    
    if (!/^\d{6}$/.test(resetCode)) {
      setResetCodeMessage('Reset code must contain only numbers');
      return;
    }
    
    setResetCodeLoading(true);
    setResetCodeMessage('');
    
    try {
      const response = await authAPI.verifyOTP(forgotPasswordEmail, resetCode);
      
      if (response.success || response.message) {
        setResetCodeMessage('Code verified successfully!');
        setTimeout(() => {
          setShowResetCodeForm(false);
          setShowResetPasswordForm(true);
        }, 1500);
        console.log('Reset code verified for:', forgotPasswordEmail);
      }
    } catch (error) {
      console.error('Reset code verification error:', error);
      
      if (error.response?.data?.detail) {
        setResetCodeMessage(error.response.data.detail);
      } else if (error.response?.status === 400) {
        setResetCodeMessage('Invalid reset code. Please check and try again.');
      } else if (error.response?.status === 404) {
        setResetCodeMessage('Reset code expired or not found.');
      } else {
        setResetCodeMessage('Failed to verify code. Please try again.');
      }
    } finally {
      setResetCodeLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetPasswordLoading(true);
    setResetPasswordMessage('');
    
    try {
      const response = await authAPI.changePassword(forgotPasswordEmail, newPassword);
      
      if (response.success || response.message) {
        setResetPasswordMessage('Password updated successfully! Redirecting to login...');
        console.log('Password reset successfully for:', forgotPasswordEmail);
        
        // Redirect to login after success
        setTimeout(() => {
          setShowResetPasswordForm(false);
          setShowForgotPassword(false);
          setShowResetCodeForm(false);
          setNewPassword('');
          setConfirmPassword('');
          setResetPasswordMessage('');
          setResetCode('');
          setResetCodeMessage('');
          setForgotPasswordEmail('');
          setForgotPasswordMessage('');
        }, 2000);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      
      if (error.response?.data?.detail) {
        setResetPasswordMessage(error.response.data.detail);
      } else if (error.response?.status === 400) {
        setResetPasswordMessage('Invalid request. Please try again.');
      } else if (error.response?.status === 404) {
        setResetPasswordMessage('User not found. Please try again.');
      } else {
        setResetPasswordMessage('Failed to reset password. Please try again.');
      }
    } finally {
      setResetPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex">
      {/* Left side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative bg-slate-900">
        <div className="w-full h-full flex items-center justify-center p-8">
          <img 
            src="/media/images/nxzen-login-illustration.svg" 
            alt="Nxzen HR Management" 
            className="w-full h-full max-w-lg max-h-screen object-contain"
          />
        </div>
      </div>
      
      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-4 lg:p-8 bg-slate-900">
      <div className="w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-32 h-20 bg-white/10 backdrop-blur-md rounded-3xl mb-6 border border-white/20 shadow-2xl">
            <img 
              src="/media/images/Nxzen logo.jpg" 
              alt="Nxzen logo" 
              className="w-28 h-16 object-contain rounded-2xl"
            />
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/70 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200"
                  placeholder="Enter your email"
                  required
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-10 pr-12 py-3 bg-slate-800/70 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors duration-200"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button 
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-green-400 hover:text-green-300 transition-colors duration-200 bg-transparent border-none cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            {/* General Error Message */}
            {errors.general && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-sm text-red-400">{errors.general}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-slate-200">Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
              <p className="text-slate-400">Enter your email address and we'll send you a link to reset your password.</p>
            </div>

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
              <div>
                <label htmlFor="forgotEmail" className="block text-sm font-medium text-slate-200 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="forgotEmail"
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/70 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200 pl-12"
                    placeholder="Enter your email"
                    required
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                </div>
              </div>

              {forgotPasswordMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  forgotPasswordMessage.includes('sent') 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {forgotPasswordMessage}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail('');
                    setForgotPasswordMessage('');
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                >
                  {forgotPasswordLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Code Verification Modal */}
      {showResetCodeForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/50 w-full max-w-md">
            <form onSubmit={handleResetCodeSubmit} className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-white">Enter Reset Code</h3>
                <p className="text-slate-400">
                  Please enter the 6-digit code sent to your email
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    maxLength="6"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-12 py-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                </div>
              </div>

              {resetCodeMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  resetCodeMessage.includes('verified') || resetCodeMessage.includes('success')
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {resetCodeMessage}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetCodeForm(false);
                    setShowForgotPassword(false);
                    setResetCode('');
                    setResetCodeMessage('');
                    setForgotPasswordEmail('');
                    setForgotPasswordMessage('');
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetCodeLoading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                >
                  {resetCodeLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    'Verify Code'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Form Modal */}
      {showResetPasswordForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/50 w-full max-w-md">
            <form onSubmit={handleResetPasswordSubmit} className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-white">Reset Password</h3>
                <p className="text-slate-400">
                  Enter your new password below
                </p>
              </div>

              <div className="space-y-4">
                {/* New Password Field */}
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-12 py-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors duration-200"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Confirm Password Field */}
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-12 py-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors duration-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {resetPasswordMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  resetPasswordMessage.includes('successfully') || resetPasswordMessage.includes('updated')
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {resetPasswordMessage}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetPasswordForm(false);
                    setShowForgotPassword(false);
                    setShowResetCodeForm(false);
                    setNewPassword('');
                    setConfirmPassword('');
                    setResetPasswordMessage('');
                    setResetCode('');
                    setResetCodeMessage('');
                    setForgotPasswordEmail('');
                    setForgotPasswordMessage('');
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetPasswordLoading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                >
                  {resetPasswordLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}