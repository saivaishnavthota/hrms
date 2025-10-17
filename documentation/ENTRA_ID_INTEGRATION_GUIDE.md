# Microsoft Entra ID Integration Guide

## Overview
This document provides a comprehensive guide for integrating Microsoft Entra ID (formerly Azure Active Directory) authentication into the HRMS application. This integration allows users to authenticate using their Microsoft organizational accounts with Single Sign-On (SSO).

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Integration Flow](#integration-flow)
4. [Azure Portal Configuration](#azure-portal-configuration)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Environment Configuration](#environment-configuration)
8. [Deployment Guide](#deployment-guide)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Authentication Flow
```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐         ┌──────────────┐
│   Browser   │         │   Frontend   │         │   Backend   │         │  Entra ID    │
│   (User)    │         │   (React)    │         │  (FastAPI)  │         │  (Microsoft) │
└──────┬──────┘         └──────┬───────┘         └──────┬──────┘         └──────┬───────┘
       │                       │                        │                        │
       │  1. Click Login       │                        │                        │
       ├──────────────────────>│                        │                        │
       │                       │                        │                        │
       │  2. Redirect to       │                        │                        │
       │     Entra ID          │                        │                        │
       │                       ├────────────────────────┼───────────────────────>│
       │                       │                        │                        │
       │  3. User enters       │                        │                        │
       │     Microsoft creds   │                        │                        │
       │<──────────────────────┼────────────────────────┼────────────────────────┤
       │                       │                        │                        │
       │  4. Auth Code         │                        │                        │
       │     redirect          │                        │                        │
       ├──────────────────────>│                        │                        │
       │                       │                        │                        │
       │                       │  5. Exchange code      │                        │
       │                       │     for tokens         │                        │
       │                       ├───────────────────────>│                        │
       │                       │                        │                        │
       │                       │                        │  6. Validate code      │
       │                       │                        ├───────────────────────>│
       │                       │                        │                        │
       │                       │                        │  7. Return tokens      │
       │                       │                        │<───────────────────────┤
       │                       │                        │                        │
       │                       │                        │  8. Get user profile   │
       │                       │                        ├───────────────────────>│
       │                       │                        │<───────────────────────┤
       │                       │                        │                        │
       │                       │                        │  9. Create/update user │
       │                       │                        │     in database        │
       │                       │                        │                        │
       │                       │  10. Return JWT token  │                        │
       │                       │      & user data       │                        │
       │                       │<───────────────────────┤                        │
       │                       │                        │                        │
       │  11. Store token      │                        │                        │
       │      & redirect       │                        │                        │
       │<──────────────────────┤                        │                        │
       │                       │                        │                        │
       │  12. Access protected │                        │                        │
       │      routes with JWT  │                        │                        │
       ├──────────────────────>├───────────────────────>│                        │
       │                       │                        │                        │
```

### Key Components

#### 1. **Entra ID (Microsoft Identity Platform)**
   - Handles user authentication
   - Issues authorization codes and tokens
   - Provides user profile information
   - Manages organizational accounts

#### 2. **Frontend (React)**
   - Initiates OAuth 2.0 flow
   - Handles redirect callbacks
   - Manages tokens in localStorage
   - Provides seamless user experience

#### 3. **Backend (FastAPI)**
   - Validates authorization codes
   - Exchanges codes for access tokens
   - Retrieves user profile from Microsoft Graph API
   - Creates/updates users in database
   - Issues internal JWT tokens
   - Manages user sessions

#### 4. **Database (PostgreSQL)**
   - Stores user profiles
   - Links Entra ID accounts to internal user records
   - Maintains role-based access control (RBAC)

---

## Prerequisites

### 1. Azure Subscription
- Active Azure subscription with admin access
- Permissions to register applications in Entra ID

### 2. Domain Setup
- Production domain configured (e.g., hrms.yourcompany.com)
- SSL/TLS certificates configured
- DNS records properly set up

### 3. Technical Requirements
- Python 3.9+ with required packages
- Node.js 16+ for frontend
- PostgreSQL database
- Redis for session management (optional but recommended)

---

## Integration Flow

### Step-by-Step Flow

#### Phase 1: User Initiates Login
1. User clicks "Sign in with Microsoft" button
2. Frontend redirects to Entra ID authorization endpoint with:
   - Client ID
   - Redirect URI
   - Requested scopes (openid, profile, email)
   - State parameter (for CSRF protection)

#### Phase 2: Microsoft Authentication
3. User is presented with Microsoft login page
4. User enters organizational credentials
5. Multi-factor authentication (if enabled)
6. User consents to requested permissions (first time only)

#### Phase 3: Authorization Code Grant
7. Entra ID redirects back to application with:
   - Authorization code
   - State parameter (validated)
8. Frontend sends code to backend

#### Phase 4: Token Exchange
9. Backend sends POST request to Microsoft token endpoint:
   - Authorization code
   - Client ID
   - Client secret
   - Redirect URI
10. Microsoft validates and returns:
    - Access token
    - ID token (JWT with user claims)
    - Refresh token (optional)

#### Phase 5: User Profile Retrieval
11. Backend calls Microsoft Graph API with access token
12. Retrieves user profile:
    - Email
    - Name
    - Job title
    - Department
    - Office location
    - Manager information

#### Phase 6: User Provisioning
13. Backend checks if user exists in database (by email)
14. If new user:
    - Create user record
    - Assign default role based on business rules
    - Store Entra ID identifier
15. If existing user:
    - Update user information
    - Validate account status

#### Phase 7: Session Creation
16. Backend generates internal JWT token with:
    - User ID
    - Role
    - Permissions
    - Expiration time
17. Return token and user data to frontend

#### Phase 8: Authenticated Access
18. Frontend stores JWT token
19. Redirects user to appropriate dashboard
20. Includes token in subsequent API requests

---

## Azure Portal Configuration

### Step 1: Register Application

1. **Navigate to Azure Portal**
   - Go to https://portal.azure.com
   - Sign in with admin credentials

2. **Access Entra ID**
   - Search for "Microsoft Entra ID" or "Azure Active Directory"
   - Click on the service

3. **App Registration**
   ```
   Left Menu → App registrations → New registration
   ```
   
   Fill in details:
   - **Name**: HRMS Application
   - **Supported account types**: 
     - Select "Accounts in this organizational directory only (Single tenant)"
   - **Redirect URI**: 
     - Platform: Web
     - URI: `https://hrms.yourcompany.com/auth/callback`
   
   Click **Register**

### Step 2: Configure Application

#### A. Overview Page
- Note down:
  - **Application (client) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
  - **Directory (tenant) ID**: `yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy`

#### B. Certificates & Secrets
1. Click "Certificates & secrets" in left menu
2. Click "New client secret"
3. Fill in:
   - **Description**: HRMS Backend Secret
   - **Expires**: 24 months (recommended)
4. Click **Add**
5. **IMPORTANT**: Copy the **Value** immediately (shows only once)
   - Store securely: `your-client-secret-value`

#### C. API Permissions
1. Click "API permissions" in left menu
2. Default permission: `User.Read` (already added)
3. Add additional permissions:
   - Click "Add a permission"
   - Select "Microsoft Graph"
   - Select "Delegated permissions"
   - Add:
     - `openid` - Sign users in
     - `profile` - View users' basic profile
     - `email` - View users' email address
     - `User.Read` - Read user profile
     - `User.ReadBasic.All` - Read all users' basic profiles (optional)
4. Click "Add permissions"
5. Click "Grant admin consent for [Organization]"

#### D. Authentication Configuration
1. Click "Authentication" in left menu
2. **Redirect URIs**:
   - Add development URI: `http://localhost:5173/auth/callback`
   - Add production URI: `https://hrms.yourcompany.com/auth/callback`
3. **Implicit grant and hybrid flows**:
   - ✅ ID tokens (used for implicit and hybrid flows)
4. **Advanced settings**:
   - Allow public client flows: No
5. **Supported account types**:
   - Ensure "Single tenant" is selected
6. Click **Save**

#### E. Token Configuration (Optional)
1. Click "Token configuration"
2. Add optional claims if needed:
   - Add "email" claim
   - Add "family_name" and "given_name"
   - Add "upn" (User Principal Name)

### Step 3: Branding (Optional)
1. Click "Branding & properties"
2. Add:
   - Publisher domain
   - Home page URL: `https://hrms.yourcompany.com`
   - Terms of service URL
   - Privacy statement URL
3. Click **Save**

---

## Backend Implementation

### Step 1: Update Requirements

Add to `Backend/requirements.txt`:
```txt
# Microsoft Authentication
msal==1.28.0
requests==2.31.0
cryptography==41.0.7
```

Install dependencies:
```bash
pip install msal requests cryptography
```

### Step 2: Update Configuration

Add to `Backend/config.py`:
```python
class config:
    # Existing configs...
    
    # Microsoft Entra ID Configuration
    ENTRA_CLIENT_ID = os.getenv("ENTRA_CLIENT_ID")
    ENTRA_CLIENT_SECRET = os.getenv("ENTRA_CLIENT_SECRET")
    ENTRA_TENANT_ID = os.getenv("ENTRA_TENANT_ID")
    ENTRA_AUTHORITY = f"https://login.microsoftonline.com/{os.getenv('ENTRA_TENANT_ID')}"
    ENTRA_REDIRECT_URI = os.getenv("ENTRA_REDIRECT_URI", "http://localhost:5173/auth/callback")
    ENTRA_SCOPES = ["User.Read", "openid", "profile", "email"]
    
    # Microsoft Graph API
    GRAPH_API_ENDPOINT = "https://graph.microsoft.com/v1.0"
```

### Step 3: Create Entra ID Service

Create `Backend/services/entra_service.py`:
```python
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
        self.app = msal.ConfidentialClientApplication(
            self.client_id,
            authority=self.authority,
            client_credential=self.client_secret,
        )
    
    def get_auth_url(self, state: str) -> str:
        """
        Generate authorization URL for user to authenticate
        
        Args:
            state: Random state parameter for CSRF protection
            
        Returns:
            Authorization URL
        """
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
                headers=headers
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
                    headers=headers
                )
                if manager_response.status_code == 200:
                    user_data['manager'] = manager_response.json()
            except:
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
        except Exception as e:
            logger.error(f"Token refresh failed: {str(e)}")
            raise HTTPException(status_code=401, detail="Token refresh failed")


# Singleton instance
entra_service = EntraIDService()
```

### Step 4: Create Entra ID Routes

Create `Backend/routes/entra_auth_routes.py`:
```python
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlmodel import Session, select
from typing import Optional
import secrets
import logging
from datetime import timedelta

from models.user_model import User
from database import get_session
from services.entra_service import entra_service
from auth import create_access_token
from schemas.user_schema import UserResponse

router = APIRouter(prefix="/auth/entra", tags=["Entra ID Authentication"])
logger = logging.getLogger(__name__)

# Store state parameters temporarily (use Redis in production)
state_store = {}

@router.get("/login")
async def entra_login():
    """
    Initiate Entra ID authentication flow
    
    Returns authorization URL for frontend to redirect
    """
    try:
        # Generate random state for CSRF protection
        state = secrets.token_urlsafe(32)
        
        # Get authorization URL
        auth_url = entra_service.get_auth_url(state)
        
        # Store state temporarily (use Redis in production)
        state_store[state] = True
        
        return {
            "auth_url": auth_url,
            "state": state
        }
    except Exception as e:
        logger.error(f"Error initiating Entra login: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initiate login")


@router.post("/callback")
async def entra_callback(
    code: str,
    state: str,
    session: Session = Depends(get_session)
):
    """
    Handle callback from Entra ID with authorization code
    
    Args:
        code: Authorization code
        state: State parameter for validation
        session: Database session
        
    Returns:
        JWT token and user information
    """
    try:
        # Validate state parameter
        if state not in state_store:
            raise HTTPException(status_code=400, detail="Invalid state parameter")
        
        # Remove used state
        del state_store[state]
        
        # Exchange code for tokens
        token_response = entra_service.acquire_token_by_auth_code(code)
        
        # Get access token
        access_token = token_response.get("access_token")
        id_token = token_response.get("id_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token received")
        
        # Get user profile from Microsoft Graph
        user_profile = entra_service.get_user_profile(access_token)
        
        # Extract user information
        email = user_profile.get("mail") or user_profile.get("userPrincipalName")
        name = user_profile.get("displayName")
        given_name = user_profile.get("givenName")
        surname = user_profile.get("surname")
        job_title = user_profile.get("jobTitle")
        department = user_profile.get("department")
        office_location = user_profile.get("officeLocation")
        entra_id = user_profile.get("id")  # Unique Entra ID identifier
        
        if not email:
            raise HTTPException(status_code=400, detail="Email not found in user profile")
        
        # Check if user exists in database
        db_user = session.exec(
            select(User).where(User.company_email == email.lower())
        ).first()
        
        if not db_user:
            # Check by personal email as fallback
            db_user = session.exec(
                select(User).where(User.email == email.lower())
            ).first()
        
        if db_user:
            # Update existing user
            db_user.name = name or db_user.name
            db_user.entra_id = entra_id  # Store Entra ID
            db_user.login_status = True
            
            # Update additional fields if available
            if job_title:
                db_user.job_title = job_title
            if department:
                db_user.department = department
                
            session.add(db_user)
            session.commit()
            session.refresh(db_user)
            
            logger.info(f"User {email} logged in via Entra ID")
        else:
            # Auto-provision new user
            # Determine role based on business logic
            default_role = determine_user_role(job_title, department)
            
            db_user = User(
                name=name,
                email=email.lower(),
                company_email=email.lower(),
                role=default_role,
                entra_id=entra_id,
                job_title=job_title,
                department=department,
                o_status=True,  # Auto-onboarded
                login_status=True,
                password_hash=""  # No password for Entra ID users
            )
            
            session.add(db_user)
            session.commit()
            session.refresh(db_user)
            
            logger.info(f"New user {email} auto-provisioned via Entra ID")
        
        # Create internal JWT token
        jwt_token = create_access_token(
            data={"sub": db_user.company_email, "role": db_user.role},
            expires_delta=timedelta(minutes=60)
        )
        
        # Return user data and token
        return UserResponse(
            employeeId=db_user.id,
            name=db_user.name,
            role=db_user.role,
            email=db_user.company_email,
            company_employee_id=db_user.company_employee_id,
            access_token=jwt_token,
            onboarding_status=db_user.o_status,
            login_status=db_user.login_status,
            type=db_user.role,
            location_id=db_user.location_id,
            super_hr=db_user.super_hr if db_user.role == "HR" else None,
            message=f"Welcome, {db_user.name}!"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Entra callback error: {str(e)}")
        session.rollback()
        raise HTTPException(status_code=500, detail="Authentication failed")


@router.get("/user-info")
async def get_entra_user_info(
    access_token: str,
):
    """
    Get user information from Microsoft Graph (for testing)
    
    Args:
        access_token: Microsoft access token
        
    Returns:
        User profile data
    """
    try:
        user_profile = entra_service.get_user_profile(access_token)
        return user_profile
    except Exception as e:
        logger.error(f"Error fetching user info: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch user info")


def determine_user_role(job_title: Optional[str], department: Optional[str]) -> str:
    """
    Determine user role based on job title and department
    
    This is a business logic function that should be customized
    based on your organization's structure
    
    Args:
        job_title: User's job title
        department: User's department
        
    Returns:
        User role (HR, Manager, Employee, etc.)
    """
    if not job_title:
        return "Employee"
    
    job_title_lower = job_title.lower()
    
    # HR roles
    if any(keyword in job_title_lower for keyword in ["hr", "human resources", "people operations"]):
        return "HR"
    
    # Manager roles
    if any(keyword in job_title_lower for keyword in ["manager", "director", "head", "lead", "supervisor"]):
        return "Manager"
    
    # Account Manager roles
    if "account manager" in job_title_lower:
        return "Account Manager"
    
    # IT roles
    if any(keyword in job_title_lower for keyword in ["it support", "it admin", "system admin"]):
        return "ITSupporter"
    
    # Default to Employee
    return "Employee"
```

### Step 5: Update Database Model

Add Entra ID fields to `Backend/models/user_model.py`:
```python
class User(SQLModel, table=True):
    __tablename__ = "employees"
    
    # Existing fields...
    
    # Add Entra ID fields
    entra_id: Optional[str] = Field(default=None, index=True, unique=True)
    job_title: Optional[str] = Field(default=None)
    department: Optional[str] = Field(default=None)
    auth_provider: Optional[str] = Field(default="local")  # "local" or "entra"
```

### Step 6: Create Database Migration

Create Alembic migration:
```bash
cd Backend
alembic revision -m "add_entra_id_fields"
```

Edit the migration file:
```python
"""add_entra_id_fields

Revision ID: xxxxxxxxxxxx
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('employees', sa.Column('entra_id', sa.String(), nullable=True))
    op.add_column('employees', sa.Column('job_title', sa.String(), nullable=True))
    op.add_column('employees', sa.Column('department', sa.String(), nullable=True))
    op.add_column('employees', sa.Column('auth_provider', sa.String(), nullable=True, server_default='local'))
    
    op.create_index('ix_employees_entra_id', 'employees', ['entra_id'], unique=True)

def downgrade():
    op.drop_index('ix_employees_entra_id', 'employees')
    op.drop_column('employees', 'auth_provider')
    op.drop_column('employees', 'department')
    op.drop_column('employees', 'job_title')
    op.drop_column('employees', 'entra_id')
```

Run migration:
```bash
alembic upgrade head
```

### Step 7: Register Routes

Update `Backend/main.py`:
```python
from routes import entra_auth_routes

app.include_router(entra_auth_routes.router)
```

---

## Frontend Implementation

### Step 1: Install Dependencies

```bash
cd Frontend
npm install @azure/msal-browser @azure/msal-react axios
```

### Step 2: Create Entra Auth Service

Create `Frontend/src/services/entraAuthService.js`:
```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Entra ID Authentication Service
 */
class EntraAuthService {
  /**
   * Initiate Entra ID login
   * @returns {Promise<string>} Authorization URL
   */
  async initiateLogin() {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/entra/login`);
      return response.data;
    } catch (error) {
      console.error('Error initiating Entra login:', error);
      throw error;
    }
  }

  /**
   * Handle callback from Entra ID
   * @param {string} code - Authorization code
   * @param {string} state - State parameter
   * @returns {Promise<Object>} User data and token
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
      throw error;
    }
  }

  /**
   * Store authentication data in localStorage
   * @param {Object} userData - User data from backend
   */
  storeAuthData(userData) {
    localStorage.setItem('authToken', userData.access_token);
    localStorage.setItem('userType', userData.type || userData.role);
    localStorage.setItem('userId', userData.employeeId);
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('authProvider', 'entra');
  }

  /**
   * Check if user is authenticated via Entra ID
   * @returns {boolean}
   */
  isEntraAuthenticated() {
    const authProvider = localStorage.getItem('authProvider');
    const token = localStorage.getItem('authToken');
    return authProvider === 'entra' && !!token;
  }

  /**
   * Logout (clear local storage)
   */
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userId');
    localStorage.removeItem('userData');
    localStorage.removeItem('authProvider');
  }
}

export default new EntraAuthService();
```

### Step 3: Create Entra Login Component

Create `Frontend/src/components/Auth/EntraLogin.jsx`:
```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import entraAuthService from '../../services/entraAuthService';
import { getRedirectPath } from '../../lib/auth';
import './EntraLogin.css';

const EntraLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleEntraLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get authorization URL from backend
      const { auth_url, state } = await entraAuthService.initiateLogin();
      
      // Store state for validation
      sessionStorage.setItem('entra_state', state);
      
      // Redirect to Microsoft login
      window.location.href = auth_url;
    } catch (error) {
      console.error('Entra login failed:', error);
      setError('Failed to initiate Microsoft login. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="entra-login-container">
      <button
        className="entra-login-btn"
        onClick={handleEntraLogin}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner"></span>
            <span>Redirecting...</span>
          </>
        ) : (
          <>
            <svg className="microsoft-icon" viewBox="0 0 21 21">
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
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default EntraLogin;
```

### Step 4: Create Callback Handler Component

Create `Frontend/src/components/Auth/EntraCallback.jsx`:
```javascript
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import entraAuthService from '../../services/entraAuthService';
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

  const handleCallback = async () => {
    try {
      // Get authorization code and state from URL
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Check for errors from Entra ID
      if (errorParam) {
        throw new Error(errorDescription || 'Authentication failed');
      }

      // Validate parameters
      if (!code || !state) {
        throw new Error('Missing authorization code or state');
      }

      // Validate state parameter
      const storedState = sessionStorage.getItem('entra_state');
      if (state !== storedState) {
        throw new Error('Invalid state parameter');
      }

      // Clear stored state
      sessionStorage.removeItem('entra_state');

      // Exchange code for token
      setStatus('authenticating');
      const userData = await entraAuthService.handleCallback(code, state);

      // Store authentication data
      entraAuthService.storeAuthData(userData);

      // Success
      setStatus('success');

      // Redirect to appropriate dashboard
      const redirectPath = getRedirectPath(userData.type);
      
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 1000);

    } catch (error) {
      console.error('Callback handling failed:', error);
      setStatus('error');
      setError(error.message || 'Authentication failed. Please try again.');
      
      // Redirect to login after 3 seconds
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
            <p>Please wait while we verify your credentials</p>
          </>
        )}

        {status === 'authenticating' && (
          <>
            <div className="spinner-large"></div>
            <h2>Signing you in...</h2>
            <p>Setting up your account</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="success-icon">✓</div>
            <h2>Authentication successful!</h2>
            <p>Redirecting to your dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="error-icon">✗</div>
            <h2>Authentication failed</h2>
            <p>{error}</p>
            <p className="redirect-msg">Redirecting to login page...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default EntraCallback;
```

### Step 5: Update Login Page

Update `Frontend/src/pages/Login.jsx`:
```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EntraLogin from '../components/Auth/EntraLogin';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLocalLogin = async (e) => {
    e.preventDefault();
    // ... existing local login logic ...
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>HRMS Login</h1>
          <p>Sign in to your account</p>
        </div>

        {/* Entra ID Login */}
        <div className="entra-login-section">
          <EntraLogin />
          
          <div className="divider">
            <span>OR</span>
          </div>
        </div>

        {/* Traditional Login Form */}
        <form onSubmit={handleLocalLogin} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@company.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in with Password'}
          </button>
        </form>

        <div className="login-footer">
          <a href="/forgot-password">Forgot Password?</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
```

### Step 6: Add Routes

Update `Frontend/src/routing/AppRoutes.jsx`:
```javascript
import { Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import EntraCallback from '../components/Auth/EntraCallback';
// ... other imports ...

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<EntraCallback />} />
      {/* ... other routes ... */}
    </Routes>
  );
};

export default AppRoutes;
```

### Step 7: Add Styles

Create `Frontend/src/components/Auth/EntraLogin.css`:
```css
.entra-login-container {
  width: 100%;
  margin-bottom: 20px;
}

.entra-login-btn {
  width: 100%;
  padding: 12px 20px;
  background-color: #ffffff;
  color: #5e5e5e;
  border: 1px solid #8c8c8c;
  border-radius: 4px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: all 0.3s ease;
}

.entra-login-btn:hover:not(:disabled) {
  background-color: #f3f3f3;
  border-color: #707070;
}

.entra-login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.microsoft-icon {
  width: 21px;
  height: 21px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #5e5e5e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  margin-top: 10px;
  padding: 10px;
  background-color: #fee;
  color: #c33;
  border: 1px solid #fcc;
  border-radius: 4px;
  font-size: 14px;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0;
  color: #8c8c8c;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #ddd;
}

.divider span {
  padding: 0 10px;
  font-size: 14px;
  font-weight: 500;
}
```

Create `Frontend/src/components/Auth/EntraCallback.css`:
```css
.entra-callback-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.callback-card {
  background: white;
  border-radius: 12px;
  padding: 60px 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 500px;
  width: 90%;
}

.spinner-large {
  width: 60px;
  height: 60px;
  border: 6px solid #f3f3f3;
  border-top: 6px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 30px;
}

.success-icon {
  width: 60px;
  height: 60px;
  background-color: #4caf50;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  margin: 0 auto 30px;
  animation: scaleIn 0.5s ease;
}

.error-icon {
  width: 60px;
  height: 60px;
  background-color: #f44336;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  margin: 0 auto 30px;
  animation: scaleIn 0.5s ease;
}

.callback-card h2 {
  margin: 0 0 10px;
  color: #333;
  font-size: 24px;
}

.callback-card p {
  margin: 0;
  color: #666;
  font-size: 16px;
  line-height: 1.5;
}

.redirect-msg {
  margin-top: 20px;
  font-size: 14px;
  color: #999;
}

@keyframes scaleIn {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
```

---

## Environment Configuration

### Development Environment

Create/Update `env.development`:
```env
# Existing variables...

# Microsoft Entra ID Configuration
ENTRA_CLIENT_ID=your-client-id-here
ENTRA_CLIENT_SECRET=your-client-secret-here
ENTRA_TENANT_ID=your-tenant-id-here
ENTRA_REDIRECT_URI=http://localhost:5173/auth/callback

# Frontend (for Vite)
VITE_API_BASE_URL=http://localhost:8000
VITE_ENTRA_ENABLED=true
```

### Production Environment

Create/Update `env.production`:
```env
# Existing variables...

# Microsoft Entra ID Configuration
ENTRA_CLIENT_ID=your-production-client-id
ENTRA_CLIENT_SECRET=your-production-client-secret
ENTRA_TENANT_ID=your-tenant-id
ENTRA_REDIRECT_URI=https://hrms.yourcompany.com/auth/callback

# Frontend
VITE_API_BASE_URL=https://api.hrms.yourcompany.com
VITE_ENTRA_ENABLED=true
```

### Docker Compose Updates

Update `docker-compose.prod.yml`:
```yaml
services:
  backend:
    environment:
      - ENTRA_CLIENT_ID=${ENTRA_CLIENT_ID}
      - ENTRA_CLIENT_SECRET=${ENTRA_CLIENT_SECRET}
      - ENTRA_TENANT_ID=${ENTRA_TENANT_ID}
      - ENTRA_REDIRECT_URI=${ENTRA_REDIRECT_URI}
      # ... other env vars ...

  frontend:
    environment:
      - VITE_API_BASE_URL=${VITE_API_BASE_URL}
      - VITE_ENTRA_ENABLED=${VITE_ENTRA_ENABLED}
      # ... other env vars ...
```

---

## Deployment Guide

### Step 1: Prepare Azure Configuration

1. Collect from Azure Portal:
   - Client ID
   - Client Secret
   - Tenant ID

2. Configure production redirect URI in Azure:
   - `https://hrms.yourcompany.com/auth/callback`

### Step 2: Update Environment Variables

```bash
# Production server
nano env.production

# Add Entra ID credentials
ENTRA_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ENTRA_CLIENT_SECRET=your-secret-here
ENTRA_TENANT_ID=yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
ENTRA_REDIRECT_URI=https://hrms.yourcompany.com/auth/callback
```

### Step 3: Run Database Migration

```bash
# SSH to production server
cd /path/to/hrms

# Run migration
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### Step 4: Rebuild and Deploy

```bash
# Stop containers
docker-compose -f docker-compose.prod.yml down

# Rebuild with new dependencies
docker-compose -f docker-compose.prod.yml build --no-cache

# Start containers
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Step 5: Verify Nginx Configuration

Ensure `nginx/nginx.conf` handles the callback route:
```nginx
location /auth/callback {
    root /usr/share/nginx/html;
    try_files $uri /index.html;
}
```

### Step 6: Test Integration

1. Navigate to login page
2. Click "Sign in with Microsoft"
3. Authenticate with Microsoft credentials
4. Verify successful login and redirection

---

## Testing

### Manual Testing Checklist

#### 1. Azure Configuration
- [ ] App registration created
- [ ] Client secret generated and stored
- [ ] Redirect URIs configured
- [ ] API permissions granted
- [ ] Admin consent provided

#### 2. Backend Testing
- [ ] `/auth/entra/login` returns auth URL
- [ ] Authorization code exchange works
- [ ] User profile fetched from Graph API
- [ ] User created/updated in database
- [ ] JWT token generated

#### 3. Frontend Testing
- [ ] "Sign in with Microsoft" button visible
- [ ] Redirect to Microsoft login works
- [ ] Callback handled correctly
- [ ] Token stored in localStorage
- [ ] Redirect to dashboard works

#### 4. Integration Testing
- [ ] New user auto-provisioning
- [ ] Existing user login
- [ ] Role assignment correct
- [ ] User profile synchronized
- [ ] Session persistence

#### 5. Security Testing
- [ ] State parameter validated
- [ ] CSRF protection working
- [ ] Token expiration handled
- [ ] HTTPS enforced (production)
- [ ] Secrets not exposed

### Testing Scripts

#### Test Entra Login Flow
```bash
# Test auth URL generation
curl http://localhost:8000/auth/entra/login

# Should return:
# {
#   "auth_url": "https://login.microsoftonline.com/...",
#   "state": "..."
# }
```

#### Test User Profile Fetch
```python
# test_entra.py
import requests

access_token = "YOUR_TEST_ACCESS_TOKEN"

response = requests.get(
    "https://graph.microsoft.com/v1.0/me",
    headers={"Authorization": f"Bearer {access_token}"}
)

print(response.json())
```

---

## Troubleshooting

### Common Issues

#### 1. "Invalid Client" Error
**Cause**: Incorrect Client ID or Secret

**Solution**:
- Verify credentials in Azure Portal
- Ensure env variables are correctly set
- Check for typos or extra spaces

#### 2. "Redirect URI Mismatch"
**Cause**: Callback URL not configured in Azure

**Solution**:
```
Azure Portal → App Registration → Authentication
→ Add redirect URI: https://hrms.yourcompany.com/auth/callback
```

#### 3. "Insufficient Permissions"
**Cause**: Required API permissions not granted

**Solution**:
```
Azure Portal → App Registration → API Permissions
→ Add User.Read, openid, profile, email
→ Grant admin consent
```

#### 4. User Profile Not Fetched
**Cause**: Access token invalid or expired

**Solution**:
- Check token expiration
- Verify scopes requested
- Ensure Graph API endpoint correct

#### 5. State Parameter Validation Failed
**Cause**: State not stored or mismatch

**Solution**:
- Use Redis for production state storage
- Implement proper state validation
- Check session/cookie settings

#### 6. CORS Errors
**Cause**: Frontend and backend on different domains

**Solution**:
Update `Backend/middleware/cors.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://hrms.yourcompany.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 7. SSL Certificate Issues
**Cause**: HTTPS not properly configured

**Solution**:
- Ensure valid SSL certificate
- Configure Nginx for HTTPS
- Update redirect URI to use https://

### Debugging Tips

#### Enable Debug Logging
```python
# Backend/main.py
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

#### Check Entra ID Logs
```
Azure Portal → Entra ID → Sign-ins
→ View authentication attempts and errors
```

#### Test Token Locally
```python
import jwt

token = "your-id-token"
claims = jwt.decode(token, options={"verify_signature": False})
print(claims)
```

---

## Security Best Practices

### 1. Secure Secret Storage
- Never commit secrets to version control
- Use environment variables
- Consider Azure Key Vault for production

### 2. Token Security
- Store tokens securely (HttpOnly cookies preferred)
- Implement token refresh mechanism
- Set appropriate token expiration

### 3. HTTPS Enforcement
- Always use HTTPS in production
- Configure HSTS headers
- Redirect HTTP to HTTPS

### 4. State Parameter
- Generate cryptographically secure random state
- Store in Redis (not in-memory dict)
- Validate on callback

### 5. User Validation
- Verify email domain matches organization
- Implement additional authorization checks
- Log authentication attempts

### 6. Rate Limiting
- Implement rate limiting on auth endpoints
- Prevent brute force attacks
- Monitor suspicious activity

---

## Additional Features

### 1. Automatic Role Mapping
Update role determination logic based on:
- Azure AD groups
- Department
- Job title
- Manager hierarchy

### 2. Group-Based Access Control
Fetch user's Azure AD groups:
```python
groups_response = requests.get(
    f"{config.GRAPH_API_ENDPOINT}/me/memberOf",
    headers=headers
)
```

Map groups to roles:
```python
group_role_mapping = {
    "HR-Team-Group-ID": "HR",
    "Management-Group-ID": "Manager",
    "IT-Support-Group-ID": "ITSupporter"
}
```

### 3. Silent Authentication
Implement refresh token flow for seamless re-authentication

### 4. Multi-Tenant Support
Support multiple organizations:
- Use common endpoint: `https://login.microsoftonline.com/common`
- Validate tenant ID in callback
- Store tenant mapping

---

## Maintenance

### Regular Tasks

#### 1. Secret Rotation
- Rotate client secrets every 6-12 months
- Update secrets in all environments
- Test before old secret expires

#### 2. Permission Review
- Review API permissions quarterly
- Remove unused permissions
- Document permission requirements

#### 3. User Audit
- Review auto-provisioned users
- Validate role assignments
- Remove deactivated accounts

#### 4. Monitoring
- Monitor authentication success rate
- Track token refresh failures
- Alert on unusual activity

---

## Support and Resources

### Microsoft Documentation
- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [MSAL Python](https://github.com/AzureAD/microsoft-authentication-library-for-python)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/)

### Internal Resources
- Azure Portal: https://portal.azure.com
- Entra ID Admin Center: https://entra.microsoft.com
- API Reference: https://api.hrms.yourcompany.com/docs

---

## Appendix

### A. Complete Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/hrms

# Redis
REDIS_URL=redis://redis:6379/0

# Email
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@company.com
MAIL_PASSWORD=your-app-password

# JWT
SECRET_KEY=your-super-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Microsoft Entra ID
ENTRA_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ENTRA_CLIENT_SECRET=your-client-secret
ENTRA_TENANT_ID=yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
ENTRA_REDIRECT_URI=https://hrms.yourcompany.com/auth/callback

# Frontend
VITE_API_BASE_URL=https://api.hrms.yourcompany.com
VITE_ENTRA_ENABLED=true
```

### B. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/entra/login` | GET | Get authorization URL |
| `/auth/entra/callback` | POST | Handle OAuth callback |
| `/auth/entra/user-info` | GET | Get user info from Graph |

### C. Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 400 | Invalid request | Check parameters |
| 401 | Unauthorized | Verify credentials |
| 403 | Forbidden | Check permissions |
| 404 | Not found | Verify endpoints |
| 500 | Server error | Check logs |

---

**Document Version**: 1.0  
**Last Updated**: October 2025  
**Author**: HRMS Development Team  
**Status**: Production Ready

