/**
 * Microsoft Entra ID Authentication Service
 * 
 * This service handles OAuth 2.0 authentication flow with Microsoft Entra ID.
 * It provides methods for login initiation, callback handling, and session management.
 */

import axios from 'axios';

// Get API base URL from environment variable or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:2343';

class EntraAuthService {
  /**
   * Initiate Entra ID login flow
   * 
   * This method calls the backend to get the Microsoft authorization URL
   * and returns the URL along with a state parameter for CSRF protection.
   * 
   * @returns {Promise<{auth_url: string, state: string}>} Authorization URL and state
   * @throws {Error} If the backend request fails
   */
  async initiateLogin() {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/entra/login`);
      return response.data;
    } catch (error) {
      console.error('Error initiating Entra login:', error);
      
      // Provide user-friendly error messages
      if (error.response?.status === 503) {
        throw new Error('Microsoft authentication is not configured. Please contact your administrator.');
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw new Error('Failed to initiate Microsoft login. Please try again.');
      }
    }
  }

  /**
   * Handle callback from Entra ID after user authentication
   * 
   * This method sends the authorization code and state to the backend
   * which will exchange them for tokens and return user data.
   * 
   * @param {string} code - Authorization code from Microsoft
   * @param {string} state - State parameter for CSRF validation
   * @returns {Promise<Object>} User data and access token
   * @throws {Error} If authentication fails
   */
  async handleCallback(code, state) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/entra/callback`, {
        code,
        state
      });
      return response.data;
    } catch (error) {
      console.error('Error handling Entra callback:', error);
      
      // Provide user-friendly error messages
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else if (error.response?.status === 400) {
        throw new Error('Invalid authorization code or state. Please try logging in again.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please verify your credentials.');
      } else {
        throw new Error('Authentication failed. Please try again.');
      }
    }
  }

  /**
   * Store authentication data in localStorage
   * 
   * This stores the JWT token and user information returned from the backend.
   * The token is used for subsequent API requests.
   * 
   * @param {Object} userData - User data from backend
   * @param {string} userData.access_token - JWT token
   * @param {string} userData.type - User role/type
   * @param {number} userData.employeeId - User ID
   */
  storeAuthData(userData) {
    try {
      localStorage.setItem('authToken', userData.access_token);
      localStorage.setItem('userType', userData.type || userData.role);
      localStorage.setItem('userId', userData.employeeId);
      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.setItem('authProvider', 'entra');
      
      console.log('Authentication data stored successfully');
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  /**
   * Check if user is authenticated via Entra ID
   * 
   * @returns {boolean} True if user is authenticated with Entra ID
   */
  isEntraAuthenticated() {
    const authProvider = localStorage.getItem('authProvider');
    const token = localStorage.getItem('authToken');
    return authProvider === 'entra' && !!token;
  }

  /**
   * Get current authentication provider
   * 
   * @returns {string|null} 'entra', 'local', or null
   */
  getAuthProvider() {
    return localStorage.getItem('authProvider');
  }

  /**
   * Logout and clear all authentication data
   * 
   * This clears all stored authentication tokens and user data.
   */
  logout() {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userType');
      localStorage.removeItem('userId');
      localStorage.removeItem('userData');
      localStorage.removeItem('authProvider');
      
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  /**
   * Check if Entra ID authentication is enabled
   * 
   * @returns {boolean} True if Entra ID is enabled in environment
   */
  isEntraEnabled() {
    return import.meta.env.VITE_ENTRA_ENABLED === 'true';
  }

  /**
   * Get user data from localStorage
   * 
   * @returns {Object|null} User data or null if not found
   */
  getUserData() {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  /**
   * Check Entra ID status from backend
   * 
   * @returns {Promise<Object>} Status object with configuration info
   */
  async checkStatus() {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/entra/status`);
      return response.data;
    } catch (error) {
      console.error('Error checking Entra status:', error);
      return { configured: false, status: 'unavailable' };
    }
  }
}

// Export singleton instance
const entraAuthService = new EntraAuthService();
export default entraAuthService;

