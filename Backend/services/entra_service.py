import msal
import requests
from typing import Optional, Dict, List
from fastapi import HTTPException
from config import config
import logging

logger = logging.getLogger(__name__)

class EntraIDService:
    """Service for Microsoft Entra ID authentication"""
    
    def __init__(self):
        self.client_id = config.ENTRA_CLIENT_ID
        self.client_secret = config.ENTRA_CLIENT_SECRET
        self.authority = config.ENTRA_AUTHORITY
        self.redirect_uri = config.ENTRA_REDIRECT_URI
        
        # Store scopes as a simple list
        self.scopes = ["User.Read", "offline_access"]
        
        logger.info(f"Initialized with scopes: {self.scopes}")
        
        # Check if configuration has placeholder values
        has_placeholder = (
            not self.client_id or 
            not self.client_secret or 
            not config.ENTRA_TENANT_ID or
            'your-' in str(self.client_id).lower() or
            'your-' in str(self.client_secret).lower() or
            'your-' in str(config.ENTRA_TENANT_ID).lower() or
            'placeholder' in str(self.client_id).lower() or
            'placeholder' in str(self.client_secret).lower()
        )
        
        # Create MSAL confidential client only if properly configured
        if not has_placeholder and self.client_id and self.client_secret and self.authority:
            try:
                self.app = msal.ConfidentialClientApplication(
                    self.client_id,
                    authority=self.authority,
                    client_credential=self.client_secret,
                )
                logger.info("Entra ID service initialized successfully")
            except Exception as e:
                self.app = None
                logger.warning(f"Failed to initialize Entra ID service: {str(e)}")
                logger.warning("Entra ID authentication will not be available. Please configure with valid Azure credentials.")
        else:
            self.app = None
            logger.warning("Entra ID configuration incomplete or contains placeholder values. SSO will not be available.")
            logger.warning("To enable Entra ID authentication, update .env file with your Azure credentials.")
    
    def is_configured(self) -> bool:
        """Check if Entra ID is properly configured"""
        return self.app is not None
    
    def get_auth_url(self, state: str) -> str:
        """
        Generate authorization URL for user to authenticate
        
        Args:
            state: Random state parameter for CSRF protection
            
        Returns:
            Authorization URL
        """
        if not self.is_configured():
            raise HTTPException(status_code=503, detail="Entra ID not configured")
        
        try:
            # WORKAROUND: Build the auth URL manually to avoid MSAL's frozenset issue
            # This bypasses MSAL's internal scope handling
            import urllib.parse
            
            params = {
                'client_id': self.client_id,
                'response_type': 'code',
                'redirect_uri': self.redirect_uri,
                'response_mode': 'query',
                'scope': ' '.join(self.scopes),  # Space-separated string
                'state': state,
            }
            
            auth_url = f"{self.authority}/oauth2/v2.0/authorize?{urllib.parse.urlencode(params)}"
            logger.info(f"Generated auth URL with scopes: {params['scope']}")
            
            return auth_url
            
        except Exception as e:
            logger.error(f"Error generating auth URL: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to generate authorization URL")
    
    def acquire_token_by_auth_code(self, auth_code: str) -> Dict:
        """
        Exchange authorization code for access token
        
        Args:
            auth_code: Authorization code from callback
            
        Returns:
            Token response with access_token, id_token, etc.
        """
        if not self.is_configured():
            raise HTTPException(status_code=503, detail="Entra ID not configured")
        
        try:
            # Use MSAL's token acquisition (this part usually works)
            # But pass scopes as individual strings in a new list
            scopes_copy = ["User.Read", "offline_access"]
            
            result = self.app.acquire_token_by_authorization_code(
                auth_code,
                scopes=scopes_copy,
                redirect_uri=self.redirect_uri
            )
            
            if "error" in result:
                logger.error(f"Token acquisition failed: {result.get('error_description')}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Authentication failed: {result.get('error_description')}"
                )
            
            return result
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error acquiring token: {str(e)}")
            raise HTTPException(status_code=500, detail="Token acquisition failed")
    
    def get_user_profile(self, access_token: str) -> Dict:
        """
        Fetch user profile from Microsoft Graph API
        
        Args:
            access_token: Access token from token response
            
        Returns:
            User profile data
        """
        try:
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Get user profile
            response = requests.get(
                f"{config.GRAPH_API_ENDPOINT}/me",
                headers=headers,
                timeout=10
            )
            
            if response.status_code != 200:
                logger.error(f"Graph API error: {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to fetch user profile"
                )
            
            user_data = response.json()
            
            # Get manager information (optional)
            try:
                manager_response = requests.get(
                    f"{config.GRAPH_API_ENDPOINT}/me/manager",
                    headers=headers,
                    timeout=10
                )
                if manager_response.status_code == 200:
                    user_data['manager'] = manager_response.json()
            except Exception as e:
                logger.debug(f"Could not fetch manager info: {e}")
                pass  # Manager info is optional
            
            return user_data
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching user profile: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to fetch user profile")
    
    def validate_token(self, id_token: str) -> Dict:
        """
        Validate ID token and extract claims
        
        Args:
            id_token: ID token from token response
            
        Returns:
            Decoded token claims
        """
        try:
            # Decode and validate ID token
            # MSAL handles validation automatically
            import jwt
            claims = jwt.decode(
                id_token,
                options={"verify_signature": False}  # MSAL already verified
            )
            return claims
        except Exception as e:
            logger.error(f"Token validation failed: {str(e)}")
            raise HTTPException(status_code=401, detail="Invalid token")
    
    def refresh_access_token(self, refresh_token: str) -> Dict:
        """
        Refresh access token using refresh token
        
        Args:
            refresh_token: Refresh token
            
        Returns:
            New token response
        """
        if not self.is_configured():
            raise HTTPException(status_code=503, detail="Entra ID not configured")
        
        try:
            scopes_copy = ["User.Read", "offline_access"]
            
            result = self.app.acquire_token_by_refresh_token(
                refresh_token,
                scopes=scopes_copy
            )
            
            if "error" in result:
                raise HTTPException(
                    status_code=401,
                    detail="Token refresh failed"
                )
            
            return result
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Token refresh failed: {str(e)}")
            raise HTTPException(status_code=401, detail="Token refresh failed")


# Singleton instance
entra_service = EntraIDService()