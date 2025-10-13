@echo off
REM Quick Production Restart Script
REM ===============================

echo 🔄 Restarting HRMS Production Environment...
echo ===========================================

echo 🛑 Stopping containers...
docker-compose -f docker-compose.prod.yml down

echo ⏳ Waiting 5 seconds...
timeout /t 5 /nobreak >nul

echo 🚀 Starting containers with updated configuration...
docker-compose -f docker-compose.prod.yml up -d

echo ⏳ Waiting for services to start...
timeout /t 30 /nobreak >nul

echo 🔍 Checking container status...
docker-compose -f docker-compose.prod.yml ps

echo.
echo ✅ Restart completed!
echo.
echo 🌐 Try accessing the application at:
echo    - Main App: http://localhost
echo    - Frontend: http://localhost:2343
echo    - Backend:  http://localhost:2342
echo.
echo 📊 To check logs: docker-compose -f docker-compose.prod.yml logs -f
