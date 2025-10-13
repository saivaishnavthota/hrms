@echo off
REM Production Troubleshooting Script for Windows
REM ============================================

echo 🔍 HRMS Production Troubleshooting
echo ==================================

REM Check if containers are running
echo 📊 Container Status:
docker-compose -f docker-compose.prod.yml ps

echo.
echo 🌐 Port Status:
echo Checking if ports are accessible...

REM Check if ports are listening
echo Port 80 (Nginx):
netstat -an | findstr :80 || echo ❌ Port 80 not listening

echo Port 2342 (Backend):
netstat -an | findstr :2342 || echo ❌ Port 2342 not listening

echo Port 2343 (Frontend):
netstat -an | findstr :2343 || echo ❌ Port 2343 not listening

echo.
echo 🔍 Container Logs:
echo ==================

echo Nginx logs (last 20 lines):
docker-compose -f docker-compose.prod.yml logs --tail=20 nginx

echo.
echo Backend logs (last 20 lines):
docker-compose -f docker-compose.prod.yml logs --tail=20 backend

echo.
echo Frontend logs (last 20 lines):
docker-compose -f docker-compose.prod.yml logs --tail=20 frontend

echo.
echo 🌐 Testing Connectivity:
echo =======================

REM Test if services are responding
echo Testing Nginx (port 80):
curl -I http://localhost:80 2>nul | findstr "HTTP" || echo ❌ Nginx not responding

echo Testing Backend (port 2342):
curl -I http://localhost:2342 2>nul | findstr "HTTP" || echo ❌ Backend not responding

echo Testing Frontend (port 2343):
curl -I http://localhost:2343 2>nul | findstr "HTTP" || echo ❌ Frontend not responding

echo.
echo 📋 Environment Check:
echo ====================

if exist "env.production" (
    echo ✅ env.production file exists
    echo Key environment variables:
    findstr /R "^(BACKEND_PORT|FRONTEND_PORT|POSTGRES_PASSWORD|REDIS_PASSWORD)" env.production
) else (
    echo ❌ env.production file not found!
)

echo.
echo 🔧 Quick Fixes to Try:
echo =====================
echo 1. Check if you're accessing http://localhost (port 80)
echo 2. Try accessing http://localhost:2343 (direct frontend)
echo 3. Check if environment variables are set correctly
echo 4. Restart containers: docker-compose -f docker-compose.prod.yml restart
echo 5. Check Windows Firewall settings
