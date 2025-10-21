# Microsoft Entra ID Integration - Complete Setup Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Azure Portal Setup](#azure-portal-setup)
4. [Backend Configuration](#backend-configuration)
5. [Frontend Configuration](#frontend-configuration)
6. [Database Migration](#database-migration)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This guide provides step-by-step instructions to integrate Microsoft Entra ID (formerly Azure Active Directory) authentication into your HRMS application. Users will be able to sign in using their Microsoft organizational accounts with Single Sign-On (SSO).

### What's Included
- ✅ Backend service and routes (already implemented)
- ✅ Frontend components (already implemented)
- ✅ Database migration (created)
- ✅ Environment configuration (templates created)
- ✅ Comprehensive documentation

### Authentication Flow
```
User clicks "Sign in with Microsoft" 
    → Redirected to Microsoft login
    → User enters credentials
    → Microsoft redirects back with authorization code
    → Backend exchanges code for tokens
    → Backend fetches user profile from Microsoft Graph API
    → User created/updated in database
    → Internal JWT token issued
    → User redirected to appropriate dashboard
```

---

## Prerequisites

### Azure Requirements
- Active Azure subscription
- Admin access to Microsoft Entra ID (Azure AD)
- Permissions to register applications

### Technical Requirements
- Python 3.9+ (Backend)
- Node.js 16+ (Frontend)
- PostgreSQL database
- Docker (recommended)
- HTTPS domain (for production)

### Dependencies Already Installed
Backend:
- `msal==1.28.0` - Microsoft Authentication Library
- `requests==2.31.0` - HTTP requests

Frontend:
- `axios` - HTTP client
- `react-router-dom` - Routing

---

## Azure Portal Setup

### Step 1: Access Azure Portal

1. Go to [https://portal.azure.com](https://portal.azure.com)
2. Sign in with your admin credentials
3. Navigate to **Microsoft Entra ID** (or Azure Active Directory)

### Step 2: Register Application

1. Click **App registrations** in the left menu
2. Click **New registration**
3. Fill in the details:
   - **Name**: `HRMS Application`
   - **Supported account types**: Select "Accounts in this organizational directory only (Single tenant)"
   - **Redirect URI**:
     - Platform: `Web`
     - URI: `http://localhost:5173/auth/callback` (for development)
4. Click **Register**

### Step 3: Note Credentials

After registration, copy these values from the Overview page:

```
Application (client) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Directory (tenant) ID:   yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
```

**⚠️ Save these values - you'll need them later!**

### Step 4: Create Client Secret

1. Click **Certificates & secrets** in the left menu
2. Click **New client secret**
3. Fill in:
   - **Description**: `HRMS Backend Secret`
   - **Expires**: `24 months` (recommended)
4. Click **Add**
5. **⚠️ IMMEDIATELY COPY THE VALUE** - it only shows once!

```
Client Secret Value: your-secret-value-here
```

### Step 5: Configure API Permissions

1. Click **API permissions** in the left menu
2. You should see `User.Read` already added (default)
3. Click **Add a permission**
4. Select **Microsoft Graph**
5. Select **Delegated permissions**
6. Add these permissions:
   - `openid` - Sign users in
   - `profile` - View users' basic profile
   - `email` - View users' email address
   - `User.Read` - Read user profile
   - `User.ReadBasic.All` - Read all users' basic profiles (optional)
7. Click **Add permissions**
8. Click **Grant admin consent for [Your Organization]**
9. Click **Yes** to confirm

### Step 6: Configure Authentication

1. Click **Authentication** in the left menu
2. Under **Redirect URIs**, add:
   - Development: `http://localhost:5173/auth/callback`
   - Production: `https://your-domain.com/auth/callback` (add later)
3. Under **Implicit grant and hybrid flows**:
   - ✅ Check **ID tokens (used for implicit and hybrid flows)**
4. Under **Advanced settings**:
   - Allow public client flows: **No**
5. Click **Save**

### Step 7: Optional - Branding

1. Click **Branding & properties**
2. Add:
   - **Home page URL**: `https://your-domain.com`
   - **Terms of service URL**: (if available)
   - **Privacy statement URL**: (if available)
3. Click **Save**

**✅ Azure Portal setup complete!**

---

## Backend Configuration

### Step 1: Update Environment Variables

Edit `env.development` and add your Azure credentials:

```env
# Microsoft Entra ID Configuration
ENTRA_CLIENT_ID=your-application-client-id-from-azure
ENTRA_CLIENT_SECRET=your-client-secret-from-azure
ENTRA_TENANT_ID=your-directory-tenant-id-from-azure
ENTRA_REDIRECT_URI=http://localhost:5173/auth/callback

# Frontend Configuration (for Vite)
VITE_ENTRA_ENABLED=true
VITE_API_BASE_URL=http://localhost:8000
```

**Replace the placeholder values with your actual Azure credentials.**

### Step 2: Verify Backend Files

The following files are already implemented:

✅ `Backend/services/entra_service.py` - Entra ID service  
✅ `Backend/routes/entra_auth_routes.py` - Authentication routes  
✅ `Backend/config.py` - Configuration with Entra ID settings  
✅ `Backend/main.py` - Routes registered  
✅ `Backend/requirements.txt` - Dependencies added

### Step 3: Install Dependencies (if not already installed)

```bash
cd Backend
pip install -r requirements.txt
```

Or with Docker:

```bash
docker-compose -f docker-compose.dev.yml build backend
```

### Step 4: Test Backend Configuration

```bash
cd Backend
python -c "from config import config; print(f'Client ID: {config.ENTRA_CLIENT_ID}')"
```

Should output your client ID (not `None`).

---

## Frontend Configuration

### Step 1: Verify Frontend Files

The following files have been created:

✅ `Frontend/src/lib/entraAuthService.js` - Authentication service  
✅ `Frontend/src/components/auth/EntraLoginButton.jsx` - Login button component  
✅ `Frontend/src/components/auth/EntraLoginButton.css` - Button styles  
✅ `Frontend/src/components/auth/EntraCallback.jsx` - Callback handler  
✅ `Frontend/src/components/auth/EntraCallback.css` - Callback page styles  
✅ `Frontend/src/components/auth/Login.jsx` - Updated with Entra button  
✅ `Frontend/src/routing/app-routing-setup.jsx` - Route added

### Step 2: Install Dependencies (if needed)

```bash
cd Frontend
npm install
```

### Step 3: Update Environment Variables

Create or update `Frontend/.env.development`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_ENTRA_ENABLED=true
```

---

## Database Migration

### Step 1: Review Migration

The migration file has been created at:
`Backend/alembic/versions/013_add_entra_id_authentication_fields.py`

This migration adds the following columns to the `employees` table:
- `entra_id` - Microsoft unique identifier (indexed, unique)
- `job_title` - Job title from Entra ID profile
- `department` - Department from Entra ID profile
- `auth_provider` - Authentication method ("local" or "entra")

### Step 2: Run Migration

**Option A: Without Docker**

```bash
cd Backend
alembic upgrade head
```

**Option B: With Docker**

```bash
# If containers are running
docker-compose -f docker-compose.dev.yml exec backend alembic upgrade head

# Or start containers first
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml exec backend alembic upgrade head
```

### Step 3: Verify Migration

Connect to PostgreSQL and verify:

```bash
psql -d Nxzen -U admin

# Check if new columns exist
\d employees

# You should see: entra_id, job_title, department, auth_provider
```

Or with Docker:

```bash
docker-compose -f docker-compose.dev.yml exec db psql -U admin -d Nxzen -c "\d employees"
```

---

## Testing

### Step 1: Start Backend

```bash
cd Backend
python main.py
```

Or with Docker:

```bash
docker-compose -f docker-compose.dev.yml up backend
```

Backend should start on `http://localhost:8000`

### Step 2: Test Backend Endpoints

```bash
# Check if Entra ID is configured
curl http://localhost:8000/auth/entra/status

# Expected response:
# {"configured": true, "provider": "Microsoft Entra ID", "status": "ready"}

# Get authorization URL
curl http://localhost:8000/auth/entra/login

# Expected response:
# {"auth_url": "https://login.microsoftonline.com/...", "state": "..."}
```

### Step 3: Start Frontend

```bash
cd Frontend
npm run dev
```

Frontend should start on `http://localhost:5173`

### Step 4: Test Login Flow

1. Open browser: `http://localhost:5173/login`
2. You should see:
   - "Sign in with Microsoft" button at the top
   - "OR" divider
   - Traditional email/password login form
3. Click **"Sign in with Microsoft"**
4. You should be redirected to Microsoft login page
5. Enter your organizational credentials
6. Complete MFA if required
7. You should be redirected back to `http://localhost:5173/auth/callback`
8. You should see a loading screen, then be redirected to your dashboard

### Step 5: Verify in Database

```bash
psql -d Nxzen -U admin

SELECT id, name, email, role, entra_id, auth_provider, job_title, department
FROM employees
WHERE auth_provider = 'entra';
```

You should see your user with:
- `entra_id` populated with Microsoft unique ID
- `auth_provider` set to "entra"
- `job_title` and `department` populated if available

### Step 6: Test Token Storage

Open browser DevTools → Console:

```javascript
// Check stored authentication data
console.log('Auth Token:', localStorage.getItem('authToken'));
console.log('User Type:', localStorage.getItem('userType'));
console.log('Auth Provider:', localStorage.getItem('authProvider'));
console.log('User Data:', JSON.parse(localStorage.getItem('userData')));
```

Should show your JWT token and user data.

---

## Deployment

### Production Environment Setup

#### Step 1: Update Azure Redirect URI

1. Go to Azure Portal → App Registration
2. Click **Authentication**
3. Add production redirect URI:
   ```
   https://your-domain.com/auth/callback
   ```
4. Click **Save**

#### Step 2: Update Production Environment

Edit `env.production`:

```env
# Microsoft Entra ID Configuration (Production)
ENTRA_CLIENT_ID=your-production-client-id
ENTRA_CLIENT_SECRET=your-production-client-secret
ENTRA_TENANT_ID=your-tenant-id
ENTRA_REDIRECT_URI=https://your-domain.com/auth/callback

# Frontend Configuration
VITE_ENTRA_ENABLED=true
VITE_API_BASE_URL=https://api.your-domain.com
```

#### Step 3: Update Docker Compose

Verify `docker-compose.prod.yml` includes environment variables:

```yaml
services:
  backend:
    environment:
      - ENTRA_CLIENT_ID=${ENTRA_CLIENT_ID}
      - ENTRA_CLIENT_SECRET=${ENTRA_CLIENT_SECRET}
      - ENTRA_TENANT_ID=${ENTRA_TENANT_ID}
      - ENTRA_REDIRECT_URI=${ENTRA_REDIRECT_URI}
      
  frontend:
    environment:
      - VITE_API_BASE_URL=${VITE_API_BASE_URL}
      - VITE_ENTRA_ENABLED=${VITE_ENTRA_ENABLED}
```

#### Step 4: Deploy to Production

```bash
# Stop running containers
docker-compose -f docker-compose.prod.yml down

# Rebuild with new code
docker-compose -f docker-compose.prod.yml build --no-cache

# Run database migration
docker-compose -f docker-compose.prod.yml run backend alembic upgrade head

# Start containers
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### Step 5: Update CORS Origins

Edit `Backend/main.py` to include production domain:

```python
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://your-domain.com",  # Add production domain
    "https://www.your-domain.com",  # Add www variant if needed
]
```

Rebuild and restart backend after this change.

#### Step 6: Configure HTTPS

Ensure your Nginx configuration handles HTTPS properly:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;

    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /auth/callback {
        proxy_pass http://frontend:80;
        try_files $uri /index.html;
    }
}
```

#### Step 7: Test Production

1. Navigate to `https://your-domain.com/login`
2. Click "Sign in with Microsoft"
3. Complete authentication flow
4. Verify successful login and redirection

---

## Troubleshooting

### Issue 1: "Entra ID not configured" Error

**Cause**: Environment variables not set

**Solution**:
```bash
# Check if variables are set
cd Backend
python -c "from config import config; print(config.ENTRA_CLIENT_ID, config.ENTRA_CLIENT_SECRET, config.ENTRA_TENANT_ID)"

# If they're None, check your .env file
cat env.development

# Make sure to load the environment file when starting
```

### Issue 2: "Redirect URI mismatch" Error

**Cause**: Callback URL not registered in Azure

**Solution**:
1. Azure Portal → App Registration → Authentication
2. Add redirect URI: `http://localhost:5173/auth/callback` (dev) or `https://your-domain.com/auth/callback` (prod)
3. Click Save
4. Clear browser cache and try again

### Issue 3: "Invalid state parameter" Error

**Cause**: State validation failed (possible CSRF attack or session expired)

**Solution**:
```javascript
// Clear session storage
sessionStorage.clear();

// Retry login
```

### Issue 4: CORS Error

**Cause**: Frontend domain not in CORS origins

**Solution**:

Edit `Backend/main.py`:

```python
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://your-domain.com",  # Add your domain
]
```

Restart backend after change.

### Issue 5: Migration Error

**Cause**: Database not accessible or migration already applied

**Solution**:
```bash
# Check database connection
psql -d Nxzen -U admin -c "SELECT version();"

# Check migration status
cd Backend
alembic current

# If migration already applied, skip it
alembic history
```

### Issue 6: "No access token received"

**Cause**: Token exchange failed

**Solution**:
1. Check backend logs for detailed error
2. Verify client secret is correct
3. Verify all API permissions are granted
4. Try generating a new client secret

### Issue 7: User Not Auto-Provisioned

**Cause**: Email not found in profile or business logic

**Solution**:

Check `Backend/routes/entra_auth_routes.py`:

```python
# The email extraction logic
email = user_profile.get("mail") or user_profile.get("userPrincipalName")
```

If users don't have `mail` field, they fall back to `userPrincipalName`.

### Issue 8: Wrong Role Assigned

**Cause**: Role determination logic

**Solution**:

Customize role mapping in `Backend/routes/entra_auth_routes.py`:

```python
def determine_user_role(job_title: Optional[str], department: Optional[str]) -> str:
    # Customize this based on your organization
    if not job_title:
        return "Employee"
    
    job_title_lower = job_title.lower()
    
    # Add your custom logic here
    if "your-custom-title" in job_title_lower:
        return "YourCustomRole"
    
    # Default logic...
```

### Debugging Tips

**Enable detailed logging**:

Edit `Backend/main.py`:

```python
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

**Check Azure Sign-in Logs**:

1. Azure Portal → Entra ID → Sign-in logs
2. Find your authentication attempt
3. Check for errors or warnings

**Test Microsoft Graph API directly**:

```bash
# Get an access token from a successful login
# Then test Graph API
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     https://graph.microsoft.com/v1.0/me
```

---

## Security Best Practices

### 1. Secure Secret Storage

- ✅ Never commit secrets to version control
- ✅ Use environment variables
- ✅ Consider Azure Key Vault for production
- ✅ Rotate client secrets every 6-12 months

### 2. HTTPS Enforcement

- ✅ Always use HTTPS in production
- ✅ Configure HSTS headers
- ✅ Redirect HTTP to HTTPS

### 3. State Parameter Validation

- ✅ Generate cryptographically secure random state
- ✅ Store in Redis (not in-memory dict) for production
- ✅ Validate on callback

### 4. Token Security

- ✅ Store tokens securely (consider HttpOnly cookies)
- ✅ Implement token refresh mechanism
- ✅ Set appropriate token expiration

### 5. User Validation

- ✅ Verify email domain matches organization
- ✅ Implement additional authorization checks
- ✅ Log all authentication attempts

### 6. Rate Limiting

- ✅ Implement rate limiting on auth endpoints
- ✅ Prevent brute force attacks
- ✅ Monitor suspicious activity

---

## Support & Resources

### Internal Documentation
- `ENTRA_ID_INTEGRATION_GUIDE.md` - Complete technical reference (1850 lines)
- `ENTRA_ID_IMPLEMENTATION_SUMMARY.md` - Overview and status
- `ENTRA_ID_QUICK_START.md` - 30-minute quick start guide
- `ENTRA_ID_RESPONSE_COMPARISON.md` - Response structure details
- `schema_map.md` - Database schema documentation

### Microsoft Resources
- [Azure Portal](https://portal.azure.com)
- [Microsoft Identity Platform Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [MSAL Python Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-python)
- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/)

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/entra/login` | GET | Get authorization URL |
| `/auth/entra/callback` | POST | Handle OAuth callback |
| `/auth/entra/status` | GET | Check configuration status |
| `/auth/entra/user-info` | GET | Get user info (testing) |

---

## Summary

You've successfully integrated Microsoft Entra ID authentication! 🎉

### What You Can Do Now

✅ Users can sign in with Microsoft credentials  
✅ Auto-provision new users from Entra ID  
✅ Sync user profiles (name, job title, department)  
✅ Maintain existing traditional login  
✅ Same JWT token and API structure

### Next Steps

1. **Test thoroughly** in development environment
2. **Customize role mapping** for your organization
3. **Deploy to production** following the deployment guide
4. **Train users** on new login option
5. **Monitor** authentication logs in Azure Portal

### Key Benefits

- 🔐 Enhanced Security - Microsoft's authentication infrastructure
- 🚀 Better UX - Single Sign-On experience
- ⚡ Faster Onboarding - Auto-provision users
- 📊 Centralized Management - Manage users in Azure AD
- 🔄 Profile Sync - Automatic profile updates

---

**Document Version**: 1.0  
**Last Updated**: October 17, 2025  
**Status**: Production Ready

