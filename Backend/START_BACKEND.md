# Start Backend Server (Port 2343)

## Quick Start

```powershell
# Set Entra ID credentials (get from Azure AD admin)
$env:ENTRA_CLIENT_ID = "your-client-id"
$env:ENTRA_CLIENT_SECRET = "your-client-secret"
$env:ENTRA_TENANT_ID = "your-tenant-id"

# Start backend
cd Backend
python -m uvicorn main:app --reload
```

Backend will run on: **http://localhost:2343**

## Verify It's Working

1. **Check server started:**
   ```
   INFO:     Uvicorn running on http://0.0.0.0:2343
   ```

2. **Check Entra ID status:**
   Visit: http://localhost:2343/auth/entra/status
   
   Should show:
   ```json
   {
     "configured": true,
     "provider": "Microsoft Entra ID",
     "status": "ready"
   }
   ```

3. **Check docs:**
   Visit: http://localhost:2343/docs
   
   You should see all API endpoints including:
   - `/auth/entra/login`
   - `/auth/entra/callback`
   - `/oauth2/redirect/microsoft` (Azure AD redirect)

## Configuration

- **Default Port**: 2343
- **Redirect URI**: `http://localhost:2343/oauth2/redirect/microsoft`
- **CORS Allowed**: `http://localhost:2343`, `http://localhost:5173`, `http://localhost:3000`

## Environment Variables

### Required for Entra ID:
- `ENTRA_CLIENT_ID` - Azure AD Application (client) ID
- `ENTRA_CLIENT_SECRET` - Azure AD Client secret
- `ENTRA_TENANT_ID` - Azure AD Directory (tenant) ID

### Optional:
- `PORT` - Override default port (default: 2343)
- `ENTRA_REDIRECT_URI` - Override redirect URI (default: `http://localhost:2343/oauth2/redirect/microsoft`)
- `DATABASE_URL` - PostgreSQL connection string

## Troubleshooting

**Port already in use:**
```powershell
netstat -ano | findstr :2343
taskkill /PID <process-id> /F
```

**Entra ID not configured:**
Check environment variables are set correctly.

**Database connection error:**
Verify PostgreSQL is running and DATABASE_URL is correct.

