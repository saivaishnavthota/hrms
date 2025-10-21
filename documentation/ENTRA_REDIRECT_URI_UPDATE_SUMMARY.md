# Entra ID Redirect URI Update Summary

**Date**: October 18, 2025  
**Updated By**: AI Assistant  
**Purpose**: Align application redirect URIs with Azure App Registration configuration

## Overview
Updated the application to use the correct Microsoft Entra ID redirect URI path that matches the Azure Portal configuration: `/oauth2/redirect/microsoft`

## Changes Made

### 1. ✅ Root `.env` File
**File**: `.env`  
**Change**: Updated redirect URI path
```diff
- ENTRA_REDIRECT_URI=http://localhost:2343/auth/callback
+ ENTRA_REDIRECT_URI=http://localhost:2343/oauth2/redirect/microsoft
```

### 2. ✅ Backend Configuration
**File**: `Backend/config.py`  
**Change**: Updated default redirect URI fallback
```diff
- ENTRA_REDIRECT_URI = os.getenv("ENTRA_REDIRECT_URI", "http://localhost:3000/auth/callback")
+ ENTRA_REDIRECT_URI = os.getenv("ENTRA_REDIRECT_URI", "http://localhost:3000/oauth2/redirect/microsoft")
```

### 3. ✅ Frontend Routing
**File**: `Frontend/src/routing/app-routing-setup.jsx`  
**Change**: Updated OAuth callback route
```diff
- <Route path="/auth/callback" element={<EntraCallback />} />
+ <Route path="/oauth2/redirect/microsoft" element={<EntraCallback />} />
```

### 4. ✅ Nginx Configuration (Frontend)
**File**: `Frontend/nginx.conf`  
**Changes**:
- Added comment documenting Entra ID callback route handling
- Added `auth` to the proxy pattern (if missing)
- Added `assets` to the proxy pattern for backend API calls

```nginx
# Handle React Router - serve index.html for all non-file routes
# This includes /oauth2/redirect/microsoft (Entra ID callback)
location / {
    try_files $uri $uri/ /index.html;
}
```

### 5. ✅ Nginx Configuration (Root)
**File**: `nginx/nginx.conf`  
**Changes**:
- Added comment documenting Entra ID callback route handling
- Updated proxy pattern to include all necessary API endpoints
- Added `auth`, `software_requests`, and `assets` to proxy regex pattern

```nginx
location ~ ^/(users|api|auth|onboarding|locations|attendance|leave|calendar|expenses|projects|weekoffs|documents|expense-management|policies|hr-config|software_requests|assets)(/|$) {
    proxy_pass http://backend:8000;
    ...
}
```

### 6. ✅ Documentation Updates
**File**: `documentation/ENTRA_REDIRECT_URI_SETUP.md`  
**Changes**:
- Updated all port references from 3000 to 2343 (actual frontend port)
- Updated configuration file references from `env.development`/`env.production` to `.env`
- Updated all example URLs to reflect correct ports and paths
- Added port configuration section documenting all application ports

### 7. ✅ Environment Templates (Reference Only)
**Files**: `env.development`, `env.production`  
**Note**: These are template files. The actual configuration is in `.env`
```diff
- ENTRA_REDIRECT_URI=http://localhost:5173/auth/callback
+ ENTRA_REDIRECT_URI=http://localhost:3000/oauth2/redirect/microsoft
```

## Required Azure Configuration

### Azure Portal Setup
In your Azure App Registration, ensure these redirect URIs are configured:

**Development:**
```
http://localhost:2343/oauth2/redirect/microsoft
```

**Production:**
```
https://your-actual-domain.com/oauth2/redirect/microsoft
```

### How to Add in Azure Portal:
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Microsoft Entra ID** → **App registrations**
3. Select your application
4. Go to **Authentication** → **Platform configurations** → **Web**
5. Click **Add URI**
6. Add: `http://localhost:2343/oauth2/redirect/microsoft`
7. Click **Save**

## Port Configuration

Your application uses the following ports (configured in `.env`):

| Service   | Port | Environment Variable |
|-----------|------|---------------------|
| Backend   | 2342 | BACKEND_PORT        |
| Frontend  | 2343 | FRONTEND_PORT       |
| Database  | 2346 | POSTGRES_PORT       |
| Redis     | 2345 | REDIS_PORT          |

## Testing the Changes

### 1. Restart Docker Containers
```bash
docker-compose down
docker-compose up --build
```

### 2. Test Authentication Flow
1. Navigate to: `http://localhost:2343`
2. Click **"Sign in with Microsoft"**
3. Complete Microsoft authentication
4. Verify redirect to: `http://localhost:2343/oauth2/redirect/microsoft?code=...`
5. Verify successful login and redirect to dashboard

### 3. Verify Configuration
```bash
# Check backend logs for Entra ID initialization
docker-compose logs backend | grep -i "entra"

# Check if redirect URI is correctly set
docker-compose exec backend env | grep ENTRA_REDIRECT_URI
```

## Authentication Flow Diagram

```
User clicks "Sign in with Microsoft"
            ↓
Frontend calls: GET /auth/entra/login
            ↓
Backend generates auth URL with redirect_uri=http://localhost:2343/oauth2/redirect/microsoft
            ↓
User redirected to Microsoft login
            ↓
User authenticates with Microsoft
            ↓
Microsoft redirects to: http://localhost:2343/oauth2/redirect/microsoft?code=xxx&state=xxx
            ↓
Frontend EntraCallback component loads
            ↓
Frontend extracts code and state from URL
            ↓
Frontend calls: POST /auth/entra/callback with code and state
            ↓
Backend exchanges code for access token with Microsoft
            ↓
Backend fetches user profile from Microsoft Graph
            ↓
Backend creates/updates user in database
            ↓
Backend returns JWT token to frontend
            ↓
User logged in and redirected to dashboard
```

## Troubleshooting

### Issue: "Redirect URI mismatch" error
**Cause**: Azure redirect URI doesn't match the one in the request

**Solution**:
1. Check `.env` file: `ENTRA_REDIRECT_URI` should be `http://localhost:2343/oauth2/redirect/microsoft`
2. Check Azure Portal redirect URIs match exactly
3. Ensure no trailing slashes
4. Restart containers: `docker-compose restart`

### Issue: 404 error after Microsoft login
**Cause**: Frontend route not properly configured

**Solution**:
1. Verify route exists in `Frontend/src/routing/app-routing-setup.jsx`
2. Check nginx is serving React app correctly
3. Rebuild frontend: `docker-compose up --build frontend`

### Issue: "Invalid state parameter" error
**Cause**: State validation failed

**Solution**:
1. Clear browser cache and sessionStorage
2. Try logging in again
3. Check browser console for errors

## Next Steps

### 1. Update `.env` with Azure Credentials
Replace placeholder values with actual Azure credentials:
```env
ENTRA_CLIENT_ID=<your-actual-client-id>
ENTRA_CLIENT_SECRET=<your-actual-client-secret>
ENTRA_TENANT_ID=<your-actual-tenant-id>
```

### 2. Configure Azure Redirect URIs
Add the development URI in Azure Portal as documented above.

### 3. Test the Integration
Follow the testing steps above to verify everything works correctly.

### 4. Production Deployment
When deploying to production:
1. Update `.env` with production redirect URI: `https://your-domain.com/oauth2/redirect/microsoft`
2. Add production redirect URI in Azure Portal
3. Ensure HTTPS is enabled
4. Test the authentication flow

## Files Modified

```
✅ .env (root directory)
✅ Backend/config.py
✅ Frontend/src/routing/app-routing-setup.jsx
✅ Frontend/nginx.conf
✅ nginx/nginx.conf
✅ documentation/ENTRA_REDIRECT_URI_SETUP.md
✅ env.development (template only)
✅ env.production (template only)
```

## Additional Resources

- **Full Setup Guide**: `documentation/ENTRA_REDIRECT_URI_SETUP.md`
- **Entra ID Quick Start**: `ENTRA_ID_QUICK_SETUP.md`
- **Entra ID Implementation**: `ENTRA_ID_IMPLEMENTATION_COMPLETE.md`
- **Microsoft Docs**: [OAuth 2.0 Authorization Code Flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow)

## Notes

- The application uses a single `.env` file for configuration (not `env.development` or `env.production`)
- Frontend runs on port **2343** (not 3000)
- Backend runs on port **2342** (not 8000)
- The redirect URI path is `/oauth2/redirect/microsoft` (not `/auth/callback`)
- All authentication routes are proxied through nginx to the backend
- The frontend callback route is handled by React Router

