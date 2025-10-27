@echo off
echo Starting HRMS Local Development Environment...

REM Set environment variables for local development
set BACKEND_PORT=8000
set FRONTEND_PORT=3000
set POSTGRES_PORT=5432
set REDIS_PORT=6379
set REDIS_PASSWORD=nxzen123
set CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173,http://localhost:80

echo Environment variables set for local development
echo.
echo Starting services with docker-compose.dev.yml...
echo.

docker-compose -f docker-compose.dev.yml up --build

pause
