# Microsoft Entra ID Integration - Quick Start Guide

## Overview
This guide will help you integrate Microsoft Entra ID authentication into your HRMS application in **5 simple steps**.

---

## Prerequisites
- Azure subscription with admin access
- Existing HRMS application running
- 30 minutes of setup time

---

## Step 1: Azure Portal Setup (10 minutes)

### 1.1 Register Application
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Microsoft Entra ID** (or Azure Active Directory)
3. Click **App registrations** → **New registration**
4. Fill in:
   - **Name**: HRMS Application
   - **Account types**: Single tenant
   - **Redirect URI**: `http://localhost:5173/auth/callback` (for development)
5. Click **Register**
6. **Save these values:**
   ```
   Application (client) ID: ________________________________________
   Directory (tenant) ID:   ________________________________________
   ```

### 1.2 Create Client Secret
1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Description: "HRMS Backend Secret"
4. Expires: 24 months
5. Click **Add**
6. **⚠️ IMMEDIATELY COPY THE VALUE** (shows only once):
   ```
   Client Secret Value: ____________________________________________
   ```

### 1.3 Configure Permissions
1. Go to **API permissions**
2. Verify these permissions exist (some auto-added):
   - `openid`
   - `profile`
   - `email`
   - `User.Read`
3. Click **Grant admin consent for [Your Organization]**
4. Click **Yes** to confirm

### 1.4 Add Redirect URIs
1. Go to **Authentication**
2. Under **Redirect URIs**, add:
   - Development: `http://localhost:5173/auth/callback`
   - Production: `https://hrms.yourcompany.com/auth/callback` (add later)
3. Under **Implicit grant**, check:
   - ✅ ID tokens
4. Click **Save**

**✅ Azure setup complete!**

---

## Step 2: Install Backend Dependencies (2 minutes)

```bash
cd Backend

# Install Python packages
pip install msal==1.28.0 requests==2.31.0

# Or rebuild Docker
docker-compose -f docker-compose.dev.yml build backend
```

**Files already updated:**
- ✅ `Backend/requirements.txt` - msal and requests added
- ✅ `Backend/config.py` - Entra ID configuration added
- ✅ `Backend/services/entra_service.py` - Service created
- ✅ `Backend/routes/entra_auth_routes.py` - Routes created
- ✅ `Backend/main.py` - Routes registered

---

## Step 3: Configure Environment Variables (3 minutes)

### 3.1 Development Environment
Edit `env.development` and add:

```env
# Microsoft Entra ID Configuration
ENTRA_CLIENT_ID=your-application-client-id-from-step-1
ENTRA_CLIENT_SECRET=your-client-secret-value-from-step-1
ENTRA_TENANT_ID=your-directory-tenant-id-from-step-1
ENTRA_REDIRECT_URI=http://localhost:5173/auth/callback

# Verify these exist
DATABASE_URL=postgresql://user:password@localhost:5432/hrms
SECRET_KEY=your-existing-secret-key
```

### 3.2 Production Environment (Later)
Edit `env.production` and add:

```env
# Microsoft Entra ID Configuration
ENTRA_CLIENT_ID=your-production-client-id
ENTRA_CLIENT_SECRET=your-production-client-secret
ENTRA_TENANT_ID=your-tenant-id
ENTRA_REDIRECT_URI=https://hrms.yourcompany.com/auth/callback
```

---

## Step 4: Update Database Schema (2 minutes)

### 4.1 Create Migration
```bash
cd Backend

# Generate migration
alembic revision -m "add_entra_id_fields"
```

### 4.2 Edit Migration File
Open `Backend/alembic/versions/xxxxxxxxxxxx_add_entra_id_fields.py`:

```python
"""add_entra_id_fields

Revision ID: xxxxxxxxxxxx
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Add Entra ID fields to employees table
    op.add_column('employees', sa.Column('entra_id', sa.String(), nullable=True))
    op.add_column('employees', sa.Column('job_title', sa.String(), nullable=True))
    op.add_column('employees', sa.Column('department', sa.String(), nullable=True))
    op.add_column('employees', sa.Column('auth_provider', sa.String(), nullable=True, server_default='local'))
    
    # Create index for fast lookups
    op.create_index('ix_employees_entra_id', 'employees', ['entra_id'], unique=True)

def downgrade():
    op.drop_index('ix_employees_entra_id', 'employees')
    op.drop_column('employees', 'auth_provider')
    op.drop_column('employees', 'department')
    op.drop_column('employees', 'job_title')
    op.drop_column('employees', 'entra_id')
```

### 4.3 Run Migration
```bash
# Apply migration
alembic upgrade head

# Verify
psql -d hrms -c "\d employees"
# Should see: entra_id, job_title, department, auth_provider columns
```

---

## Step 5: Frontend Integration (5 minutes)

### 5.1 Create Service File
Create `Frontend/src/services/entraAuthService.js`:

```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class EntraAuthService {
  async initiateLogin() {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/entra/login`);
      return response.data;
    } catch (error) {
      console.error('Error initiating Entra login:', error);
      throw error;
    }
  }

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

  storeAuthData(userData) {
    localStorage.setItem('authToken', userData.access_token);
    localStorage.setItem('userType', userData.type || userData.role);
    localStorage.setItem('userId', userData.employeeId);
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('authProvider', 'entra');
  }

  isEntraAuthenticated() {
    const authProvider = localStorage.getItem('authProvider');
    const token = localStorage.getItem('authToken');
    return authProvider === 'entra' && !!token;
  }

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

### 5.2 Create Entra Login Button Component
Create `Frontend/src/components/Auth/EntraLoginButton.jsx`:

```javascript
import React, { useState } from 'react';
import entraAuthService from '../../services/entraAuthService';
import './EntraLoginButton.css';

const EntraLoginButton = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEntraLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const { auth_url, state } = await entraAuthService.initiateLogin();
      sessionStorage.setItem('entra_state', state);
      window.location.href = auth_url;
    } catch (error) {
      console.error('Entra login failed:', error);
      setError('Failed to initiate Microsoft login. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="entra-login-wrapper">
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
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default EntraLoginButton;
```

### 5.3 Create CSS File
Create `Frontend/src/components/Auth/EntraLoginButton.css`:

```css
.entra-login-wrapper {
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
```

### 5.4 Create Callback Handler
Create `Frontend/src/pages/EntraCallback.jsx`:

```javascript
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import entraAuthService from '../services/entraAuthService';
import { getRedirectPath } from '../lib/auth';
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
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (errorParam) {
        throw new Error(errorDescription || 'Authentication failed');
      }

      if (!code || !state) {
        throw new Error('Missing authorization code or state');
      }

      const storedState = sessionStorage.getItem('entra_state');
      if (state !== storedState) {
        throw new Error('Invalid state parameter');
      }

      sessionStorage.removeItem('entra_state');

      setStatus('authenticating');
      const userData = await entraAuthService.handleCallback(code, state);

      entraAuthService.storeAuthData(userData);

      setStatus('success');

      const redirectPath = getRedirectPath(userData.type);
      
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 1000);

    } catch (error) {
      console.error('Callback handling failed:', error);
      setStatus('error');
      setError(error.message || 'Authentication failed. Please try again.');
      
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

### 5.5 Create Callback CSS
Create `Frontend/src/pages/EntraCallback.css`:

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

### 5.6 Update Login Page
Update your existing `Frontend/src/pages/Login.jsx` to include the button:

```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EntraLoginButton from '../components/Auth/EntraLoginButton';
// ... your existing imports

const Login = () => {
  // ... your existing state and handlers

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>HRMS Login</h1>
        
        {/* Add Entra ID Login */}
        <EntraLoginButton />
        
        <div className="divider">
          <span>OR</span>
        </div>
        
        {/* Your existing traditional login form */}
        <form onSubmit={handleTraditionalLogin}>
          {/* ... existing form fields ... */}
        </form>
      </div>
    </div>
  );
};

export default Login;
```

### 5.7 Add Route
Update `Frontend/src/routing/AppRoutes.jsx`:

```javascript
import EntraCallback from '../pages/EntraCallback';

// In your Routes component:
<Route path="/auth/callback" element={<EntraCallback />} />
```

---

## Step 6: Test Integration (5 minutes)

### 6.1 Start Services
```bash
# Terminal 1 - Backend
cd Backend
python main.py
# Should start on http://localhost:8000

# Terminal 2 - Frontend
cd Frontend
npm run dev
# Should start on http://localhost:5173
```

### 6.2 Test Entra ID Configuration
```bash
# Check if Entra ID is configured
curl http://localhost:8000/auth/entra/status

# Expected response:
# {"configured": true, "provider": "Microsoft Entra ID", "status": "ready"}
```

### 6.3 Test Login Flow
1. Open browser: `http://localhost:5173/login`
2. Click "Sign in with Microsoft"
3. You should be redirected to Microsoft login
4. Enter your organizational credentials
5. You should be redirected back and logged in
6. Check browser console - should see your user data

### 6.4 Verify Database
```bash
psql -d hrms

# Check if user was created/updated
SELECT id, name, email, role, entra_id, auth_provider 
FROM employees 
WHERE email = 'your-email@nxzen.com';

# Should see entra_id populated
```

---

## Troubleshooting

### Issue 1: "Entra ID not configured"
**Solution**: Check environment variables
```bash
cd Backend
python -c "from config import config; print(config.ENTRA_CLIENT_ID)"
# Should print your client ID, not None
```

### Issue 2: "Redirect URI mismatch"
**Solution**: Add redirect URI in Azure Portal
1. Azure Portal → App Registration → Authentication
2. Add: `http://localhost:5173/auth/callback`
3. Click Save

### Issue 3: "Invalid state parameter"
**Solution**: Clear browser cache/session storage
```javascript
sessionStorage.clear();
```

### Issue 4: CORS Error
**Solution**: Add localhost to CORS origins in `Backend/main.py`
```python
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```

### Issue 5: Migration Error
**Solution**: Check database connection
```bash
# Test connection
psql -d hrms -c "SELECT version();"

# If error, check DATABASE_URL in env.development
```

---

## Production Deployment Checklist

### Before Deploying
- [ ] Update production redirect URI in Azure Portal
- [ ] Add production redirect URI: `https://hrms.yourcompany.com/auth/callback`
- [ ] Update `env.production` with production values
- [ ] Test on staging environment first
- [ ] Run database migration on production
- [ ] Update CORS origins for production domain
- [ ] Configure HTTPS/SSL certificates
- [ ] Test login flow end-to-end

### Deploy Commands
```bash
# Update environment
nano env.production

# Rebuild containers
docker-compose -f docker-compose.prod.yml build --no-cache

# Run migration
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Restart services
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

---

## Next Steps

1. **Customize Role Mapping**
   - Edit `determine_user_role()` in `Backend/routes/entra_auth_routes.py`
   - Map Microsoft job titles to your roles

2. **Add Group-Based Access**
   - Fetch Azure AD groups
   - Map groups to roles and permissions

3. **Implement Silent Authentication**
   - Store refresh tokens
   - Implement token refresh flow

4. **Add Audit Logging**
   - Log all Entra ID logins
   - Track authentication failures

5. **Configure Auto-Provisioning Rules**
   - Define which users can auto-provision
   - Set default roles and permissions

---

## Support

### Documentation
- Full Integration Guide: `documentation/ENTRA_ID_INTEGRATION_GUIDE.md`
- Response Comparison: `documentation/ENTRA_ID_RESPONSE_COMPARISON.md`

### Microsoft Resources
- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [MSAL Python Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-python)

### Internal Support
- Check backend logs: `docker-compose logs -f backend`
- Check frontend console: Browser DevTools → Console
- Database queries: `psql -d hrms`

---

**✅ Integration Complete!**

You now have Microsoft Entra ID authentication working alongside traditional login, returning the **exact same response structure**!

---

**Document Version**: 1.0  
**Last Updated**: October 2025  
**Estimated Setup Time**: 30 minutes

