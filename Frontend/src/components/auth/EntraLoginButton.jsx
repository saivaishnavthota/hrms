/**
 * Microsoft Entra ID Login Button Component
 * 
 * This component provides a "Sign in with Microsoft" button
 * that initiates the OAuth 2.0 authentication flow with Entra ID.
 */

import React, { useState } from 'react';
import entraAuthService from '../../lib/entraAuthService';
import './EntraLoginButton.css';

const EntraLoginButton = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handle Entra ID login button click
   * 
   * This initiates the OAuth flow by:
   * 1. Calling backend to get authorization URL
   * 2. Storing state in session storage for validation
   * 3. Redirecting to Microsoft login page
   */
  const handleEntraLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get authorization URL from backend
      const { auth_url, state } = await entraAuthService.initiateLogin();
      
      // Store state for CSRF validation when returning from Microsoft
      sessionStorage.setItem('entra_state', state);
      
      // Redirect to Microsoft login page
      window.location.href = auth_url;
    } catch (error) {
      console.error('Entra login failed:', error);
      setError(error.message || 'Failed to initiate Microsoft login. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="entra-login-wrapper">
      <button
        className="entra-login-btn"
        onClick={handleEntraLogin}
        disabled={loading}
        type="button"
      >
        {loading ? (
          <>
            <span className="spinner"></span>
            <span>Redirecting to Microsoft...</span>
          </>
        ) : (
          <>
            <svg className="microsoft-icon" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
              <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
              <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
            </svg>
            <span>Sign in with Microsoft</span>
          </>
        )}
      </button>
      
      {error && (
        <div className="entra-error-message">
          <svg 
            className="error-icon" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
              clipRule="evenodd" 
            />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};

export default EntraLoginButton;

