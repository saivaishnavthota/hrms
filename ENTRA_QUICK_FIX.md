# Entra ID Login - Quick Fix

## The Problem
Your backend is on port **2343**, but Entra ID is configured for port **8000**.
This causes: `Token acquisition failed: 500: Token acquisition failed`

## Quick Fix (3 Steps)

### ✅ Step 1: Update Azure AD Portal (REQUIRED)
1. Go to https://portal.azure.com
2. **Entra ID** → **App registrations** → **Your App**
3. Click **Authentication**
4. Under **Redirect URIs**, add:
   ```
   http://localhost:2343/auth/entra/callback
   ```
5. Click **Save**

### ✅ Step 2: Set Environment Variable

**Option A - Quick (this session only):**
```powershell
$env:ENTRA_REDIRECT_URI="http://localhost:2343/auth/entra/callback"
```

**Option B - Permanent:**
Run the setup script:
```powershell
.\Backend\setup_entra_port.ps1
```

### ✅ Step 3: Restart Backend
Restart your backend server in the SAME PowerShell window where you set the variable.

## Verify It's Working

When you try to login, check the backend logs for:
```
INFO: Current redirect URI configured: http://localhost:2343/auth/entra/callback
INFO: Token acquired successfully
```

## Still Having Issues?

1. **Check your Entra ID credentials are set:**
   ```powershell
   $env:ENTRA_CLIENT_ID
   $env:ENTRA_CLIENT_SECRET
   $env:ENTRA_TENANT_ID
   ```
   If these are empty, you need to set them.

2. **Check the detailed error in backend logs** - I've added better error messages that will show exactly what Microsoft says is wrong.

3. **Make sure redirect URIs match EXACTLY:**
   - Azure AD: `http://localhost:2343/auth/entra/callback`
   - Environment Variable: `http://localhost:2343/auth/entra/callback`
   - No trailing slashes, same port, same protocol

## Full Documentation
See `ENTRA_ID_PORT_FIX.md` for complete details.

