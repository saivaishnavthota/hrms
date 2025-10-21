# Microsoft Entra ID - Quick Setup Guide

## ✅ Configuration Complete - Ready to Enable

Your HRMS application has been configured for Microsoft Entra ID authentication! The app will work normally with traditional login, and you can enable Entra ID when ready.

---

## 🎯 Current Status

✅ Backend code implemented  
✅ Frontend components created  
✅ Database migration ready  
✅ Docker compose configured  
✅ `.env` file prepared with placeholders  

**Your app will start normally** - Entra ID is optional and won't prevent the app from running.

---

## 🚀 To Enable Microsoft Entra ID (When Ready)

### Step 1: Azure Portal Setup (10 minutes)

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Microsoft Entra ID** → **App registrations**
3. Click **New registration**
4. Fill in:
   - Name: `HRMS Application`
   - Supported account types: `Single tenant`
   - Redirect URI: `http://localhost:2343/auth/callback`
5. Click **Register**

### Step 2: Get Credentials

After registration, copy these 3 values:

1. **Application (client) ID** from Overview page
2. **Directory (tenant) ID** from Overview page
3. Go to **Certificates & secrets** → Create **New client secret** → Copy the **Value**

### Step 3: Configure Permissions

1. Go to **API permissions**
2. Click **Add a permission** → **Microsoft Graph** → **Delegated permissions**
3. Add:
   - `openid`
   - `profile`
   - `email`
   - `User.Read`
4. Click **Add permissions**
5. Click **Grant admin consent**

### Step 4: Update Your `.env` File

Open your `.env` file and replace these 3 lines with your actual values:

```env
ENTRA_CLIENT_ID=your-application-client-id-here          ← Replace with Application (client) ID
ENTRA_CLIENT_SECRET=your-client-secret-here              ← Replace with Client secret value
ENTRA_TENANT_ID=your-tenant-id-here                      ← Replace with Directory (tenant) ID
```

### Step 5: Run Database Migration

```bash
# Option 1: With Docker (recommended)
docker-compose exec backend alembic upgrade head

# Option 2: Without Docker
cd Backend
alembic upgrade head
```

### Step 6: Rebuild and Restart Your Application

Since we updated the nginx configuration, you need to rebuild the frontend:

```bash
# Stop containers
docker-compose down

# Rebuild frontend and backend
docker-compose build --no-cache

# Start containers
docker-compose up -d

# Check logs
docker-compose logs -f backend
```

You should see: `INFO: Entra ID service initialized successfully`

### Step 7: Test It!

1. Open `http://localhost:2343/login`
2. You'll see a **"Sign in with Microsoft"** button
3. Click it and authenticate with your Microsoft account
4. You'll be logged in automatically!

---

## 📝 Your Current Configuration

### Ports (from `.env`)
- **Backend**: `http://localhost:2342`
- **Frontend**: `http://localhost:2343`
- **Database**: Port `2346`
- **Redis**: Port `2345`

### Redirect URI
When you configure Azure, use:
```
http://localhost:2343/auth/callback
```

### API URL (for frontend)
```
http://localhost:2342
```

---

## 🔧 Current `.env` File Structure

```env
# Existing configuration
VITE_APP_NAME=metronic-react-vite-starter-kit
VITE_APP_VERSION=9.2.6
VITE_API_URL=http://localhost:2342

BACKEND_PORT=2342
FRONTEND_PORT=2343
POSTGRES_PORT=2346
REDIS_PORT=2345
REDIS_PASSWORD=redis123

# Microsoft Entra ID Configuration (Placeholders - Replace when ready)
ENTRA_CLIENT_ID=your-application-client-id-here
ENTRA_CLIENT_SECRET=your-client-secret-here
ENTRA_TENANT_ID=your-tenant-id-here
ENTRA_REDIRECT_URI=http://localhost:2343/auth/callback

# Frontend Entra ID Configuration
VITE_ENTRA_ENABLED=true
```

---

## 🎉 How It Works

### Before Configuring Entra ID
- Your app starts normally
- Login page shows the Microsoft button (but it won't work yet)
- Traditional email/password login works as usual
- Backend logs show: "Entra ID configuration incomplete"

### After Configuring Entra ID
- Both login methods work
- Users can choose Microsoft SSO or traditional login
- New users auto-provisioned on first Microsoft login
- Existing users can link their Microsoft account

---

## 🔍 Troubleshooting

### App Won't Start?
**Issue**: Backend crashes with Entra ID error

**Solution**: The fix has been applied! The app will now start even with placeholder values. Just restart:
```bash
docker-compose restart backend
```

### Can't See Microsoft Button?
**Cause**: Frontend not rebuilt with new code

**Solution**:
```bash
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### Migration Not Applied?
**Check**:
```bash
docker-compose exec backend alembic current
```

**Apply**:
```bash
docker-compose exec backend alembic upgrade head
```

---

## 📚 Full Documentation

For detailed information, see:
- `documentation/ENTRA_ID_SETUP_GUIDE.md` - Complete setup guide
- `ENTRA_ID_IMPLEMENTATION_COMPLETE.md` - Implementation summary
- `documentation/ENTRA_ID_INTEGRATION_GUIDE.md` - Technical deep dive

---

## ✅ What To Do Now

### Option 1: Use Traditional Login (Default)
- Your app works as before
- No changes needed
- Microsoft button visible but won't work until configured

### Option 2: Enable Microsoft SSO
- Follow Steps 1-7 above
- Takes about 20-30 minutes
- Both login methods will work

---

## 🆘 Need Help?

**Azure Portal Issues**: Check Azure documentation or contact Azure support  
**Configuration Issues**: Check logs with `docker-compose logs -f backend`  
**Database Issues**: Check migration status with `docker-compose exec backend alembic current`

---

**Quick Start**: Just start your app - it will work with traditional login!  
**Enable Entra ID**: Follow the 7 steps above when ready.

🚀 **Your app is ready to use!**

