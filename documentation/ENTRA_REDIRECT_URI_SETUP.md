# Microsoft Entra ID Redirect URI Configuration

## Overview
This document explains the redirect URI setup for Microsoft Entra ID (Azure AD) authentication in the HRMS application.

## Redirect URI Path
The application uses the following path for OAuth 2.0 callbacks:
```
/oauth2/redirect/microsoft
```

## Environment-Specific Redirect URIs

### Development Environment
```
http://localhost:2343/oauth2/redirect/microsoft
```
**Note**: Port 2343 is the frontend port configured in your `.env` file

### Production Environment
```
https://your-domain.com/oauth2/redirect/microsoft
```

## Azure App Registration Configuration

### Step 1: Add Redirect URIs in Azure Portal
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Microsoft Entra ID** → **App registrations**
3. Select your application
4. Go to **Authentication** section
5. Under **Platform configurations** → **Web**, add the following Redirect URIs:

   **For Development:**
   ```
   http://localhost:2343/oauth2/redirect/microsoft
   ```

   **For Production:**
   ```
   https://your-domain.com/oauth2/redirect/microsoft
   ```

6. Click **Save**

### Step 2: Verify Redirect URI Settings
Ensure the following settings are configured:
- **Platform**: Web
- **Redirect URIs**: Listed as above
- **Front-channel logout URL**: (optional)
- **Implicit grant**: ID tokens (optional, not required for authorization code flow)

## Application Configuration

### Backend Configuration
The redirect URI is configured in the following files:

1. **`.env`** (Root directory - Primary configuration file):
   ```env
   ENTRA_REDIRECT_URI=http://localhost:2343/oauth2/redirect/microsoft
   ```
   
   **Note**: Your application uses port 2343 for the frontend (configured via `FRONTEND_PORT=2343`)

2. **Backend/config.py** (Default fallback):
   ```python
   ENTRA_REDIRECT_URI = os.getenv("ENTRA_REDIRECT_URI", "http://localhost:3000/oauth2/redirect/microsoft")
   ```

### Frontend Configuration
The callback route is configured in:

**Frontend/src/routing/app-routing-setup.jsx**:
```jsx
<Route path="/oauth2/redirect/microsoft" element={<EntraCallback />} />
```

## Authentication Flow

1. **User clicks "Sign in with Microsoft"** on login page
2. **Backend generates authorization URL** with the configured redirect URI
3. **User is redirected to Microsoft login** page
4. **User authenticates** with Microsoft credentials
5. **Microsoft redirects back** to: `http://localhost:2343/oauth2/redirect/microsoft?code=xxx&state=xxx`
6. **Frontend EntraCallback component** extracts the authorization code
7. **Frontend sends code** to backend API endpoint
8. **Backend exchanges code** for access token with Microsoft
9. **Backend creates/updates user** in database
10. **Backend returns JWT token** to frontend
11. **User is redirected** to their dashboard

## Important Notes

### Port Configuration
- **Frontend Development Port**: 2343 (configured in `.env` file as `FRONTEND_PORT=2343`)
- **Backend Development Port**: 2342 (configured in `.env` file as `BACKEND_PORT=2342`)
- **Database Port**: 2346 (configured in `.env` file as `POSTGRES_PORT=2346`)
- **Redis Port**: 2345 (configured in `.env` file as `REDIS_PORT=2345`)
- The redirect URI must match the frontend port exactly

### Security Considerations
1. **State Parameter**: Used for CSRF protection
2. **HTTPS Required**: Production must use HTTPS
3. **Exact Match**: The redirect URI in Azure must exactly match the one sent in the authorization request
4. **Domain Verification**: Production domain must be verified in Azure

### Troubleshooting

#### Error: "Redirect URI mismatch"
**Cause**: The redirect URI in the request doesn't match any URI configured in Azure.

**Solution**:
1. Check Azure Portal → App Registration → Authentication → Redirect URIs
2. Verify the URI exactly matches (including http/https, port, and path)
3. Ensure there are no trailing slashes
4. Check environment variables in the root `.env` file

#### Error: "Invalid state parameter"
**Cause**: State validation failed (possible CSRF attack or session timeout).

**Solution**:
1. Clear browser cache and cookies
2. Try logging in again
3. Check if sessionStorage is enabled in browser

#### Frontend shows 404 after Microsoft login
**Cause**: The route `/oauth2/redirect/microsoft` is not properly configured.

**Solution**:
1. Verify the route exists in `app-routing-setup.jsx`
2. Check that the EntraCallback component is properly imported
3. Rebuild the frontend: `docker-compose restart frontend`

## Testing the Configuration

### Development Testing
1. Start the application: `docker-compose up`
2. Navigate to: `http://localhost:2343`
3. Click "Sign in with Microsoft"
4. Complete Microsoft authentication
5. Verify redirect to: `http://localhost:2343/oauth2/redirect/microsoft?code=...`
6. Verify successful login and redirect to dashboard

### Production Testing
1. Deploy the application to production
2. Update `.env` file with actual production domain and HTTPS redirect URI
3. Add production redirect URI in Azure Portal
4. Test login flow on production domain
5. Verify HTTPS is enforced

## References
- [Microsoft OAuth 2.0 Authorization Code Flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow)
- [Redirect URI Restrictions](https://learn.microsoft.com/en-us/entra/identity-platform/reply-url)
- [MSAL Python Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-python)

