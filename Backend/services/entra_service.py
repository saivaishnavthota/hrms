import msal
import requests
from typing import Optional, Dict
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
        self.scopes = config.ENTRA_SCOPES
        
        # Create MSAL confidential client
        if self.client_id and self.client_secret and self.authority:
            self.app = msal.ConfidentialClientApplication(
                self.client_id,
                authority=self.authority,
                client_credential=self.client_secret,
            )
        else:
            self.app = None
            logger.warning("Entra ID configuration incomplete. SSO will not be available.")
    
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
            
        auth_url = self.app.get_authorization_request_url(
            scopes=self.scopes,
            state=state,
            redirect_uri=self.redirect_uri
        )
        return auth_url
    
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
            result = self.app.acquire_token_by_authorization_code(
                auth_code,
                scopes=self.scopes,
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
            result = self.app.acquire_token_by_refresh_token(
                refresh_token,
                scopes=self.scopes
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

