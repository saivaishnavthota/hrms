/**
 * Microsoft Entra ID Callback Handler Component
 * 
 * This component handles the OAuth 2.0 callback from Microsoft Entra ID.
 * It processes the authorization code, exchanges it for tokens via the backend,
 * and redirects the user to the appropriate dashboard.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import entraAuthService from '../../lib/entraAuthService';
import { getRedirectPath } from '../../lib/auth';
import './EntraCallback.css';

const EntraCallback = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    handleCallback();
  }, []);

  /**
   * Handle the OAuth callback
   * 
   * This function:
   * 1. Extracts code and state from URL parameters
   * 2. Validates the state parameter against stored value
   * 3. Sends code to backend for token exchange
   * 4. Stores authentication data
   * 5. Redirects to appropriate dashboard
   */
  const handleCallback = async () => {
    try {
      // Get authorization code and state from URL
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Check if Microsoft returned an error
      if (errorParam) {
        console.error('Microsoft authentication error:', errorParam, errorDescription);
        throw new Error(errorDescription || 'Authentication was cancelled or failed');
      }

      // Validate required parameters
      if (!code || !state) {
        throw new Error('Missing authorization code or state parameter. Please try logging in again.');
      }

      // Validate state parameter (CSRF protection)
      const storedState = sessionStorage.getItem('entra_state');
      if (state !== storedState) {
        throw new Error('Invalid state parameter. Possible CSRF attack. Please try logging in again.');
      }

      // Clear stored state (one-time use)
      sessionStorage.removeItem('entra_state');

      // Update status
      setStatus('authenticating');

      // Exchange authorization code for access token via backend
      const userData = await entraAuthService.handleCallback(code, state);

      console.log('Authentication successful:', userData);

      // Store authentication data in localStorage
      entraAuthService.storeAuthData(userData);

      // Update status
      setStatus('success');

      // Get redirect path based on user role
      const redirectPath = getRedirectPath(userData.type || userData.role);
      
      console.log('Redirecting to:', redirectPath);

      // Redirect to appropriate dashboard after a brief delay
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 1000);

    } catch (error) {
      console.error('Callback handling failed:', error);
      setStatus('error');
      setError(error.message || 'Authentication failed. Please try again.');
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    }
  };

  return (
    <div className="entra-callback-container">
      <div className="callback-card">
        {status === 'processing' && (
          <>
            <div className="spinner-large"></div>
            <h2>Processing authentication...</h2>
            <p>Please wait while we verify your Microsoft credentials</p>
          </>
        )}

        {status === 'authenticating' && (
          <>
            <div className="spinner-large"></div>
            <h2>Signing you in...</h2>
            <p>Setting up your account and permissions</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="success-icon">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path 
                  fillRule="evenodd" 
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
            <h2>Authentication successful!</h2>
            <p>Redirecting to your dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="error-icon">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
            <h2>Authentication failed</h2>
            <p className="error-description">{error}</p>
            <p className="redirect-msg">Redirecting to login page...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default EntraCallback;

