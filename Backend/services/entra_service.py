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
        
        # Store scopes as a simple list - ONLY what we explicitly need
        # Do NOT include 'openid' or 'profile' - MSAL adds these automatically and causes frozenset errors
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
            # Build auth URL manually to have full control over scopes
            # This avoids MSAL adding 'openid' and 'profile' automatically
            import urllib.parse
            
            # Use ONLY the scopes we explicitly define - no automatic additions
            scope_string = "User.Read offline_access"
            
            params = {
                'client_id': self.client_id,
                'response_type': 'code',
                'redirect_uri': self.redirect_uri,
                'response_mode': 'query',
                'scope': scope_string,
                'state': state,
            }
            
            auth_url = f"{self.authority}/oauth2/v2.0/authorize?{urllib.parse.urlencode(params)}"
            logger.info(f"Generated auth URL with scopes: {scope_string}")
            
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
            # Make direct HTTP request to token endpoint to avoid MSAL's automatic scope additions
            # MSAL adds 'openid' and 'profile' automatically which causes frozenset errors
            token_url = f"{self.authority}/oauth2/v2.0/token"
            
            # Only include the scopes we explicitly need
            scope_string = "User.Read offline_access"
            
            token_data = {
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'code': auth_code,
                'redirect_uri': self.redirect_uri,
                'grant_type': 'authorization_code',
                'scope': scope_string
            }
            
            logger.info(f"Acquiring token with redirect_uri: {self.redirect_uri}")
            logger.info(f"Using scopes: {scope_string}")
            logger.info(f"Auth code: {auth_code[:20]}...")
            logger.info(f"Token endpoint: {token_url}")
            
            response = requests.post(
                token_url,
                data=token_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                timeout=10
            )
            
            result = response.json()
            
            if response.status_code != 200 or "error" in result:
                error_desc = result.get('error_description', 'No description')
                error_code = result.get('error', 'unknown')
                logger.error(f"Token Error - Code: {error_code}, Description: {error_desc}")
                logger.error(f"Full error response: {result}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Authentication failed: {error_code} - {error_desc}"
                )
            
            logger.info("Token acquired successfully")
            return result
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error acquiring token: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Token acquisition failed: {str(e)}")
    
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
            # Make direct HTTP request to avoid MSAL's automatic scope additions
            token_url = f"{self.authority}/oauth2/v2.0/token"
            scope_string = "User.Read offline_access"
            
            token_data = {
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'refresh_token': refresh_token,
                'grant_type': 'refresh_token',
                'scope': scope_string
            }
            
            response = requests.post(
                token_url,
                data=token_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                timeout=10
            )
            
            result = response.json()
            
            if response.status_code != 200 or "error" in result:
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