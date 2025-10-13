@echo off
REM Development Deployment Script for Windows
REM =========================================

echo 🚀 Starting development deployment...

REM Load environment variables
if exist "env.development" (
    echo ✅ Environment variables will be loaded from env.development
) else (
    echo ❌ env.development file not found!
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Stop existing containers
echo 🛑 Stopping existing containers...
docker-compose -f docker-compose.dev.yml down

REM Remove old images (optional)
echo 🧹 Cleaning up old images...
docker system prune -f

REM Build and start services
echo 🔨 Building and starting development services...
docker-compose -f docker-compose.dev.yml up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Check service health
echo 🔍 Checking service health...

REM Check backend
curl -f http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is healthy
) else (
    echo ❌ Backend health check failed
    docker-compose -f docker-compose.dev.yml logs backend
    exit /b 1
)

REM Check frontend
curl -f http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is healthy
) else (
    echo ❌ Frontend health check failed
    docker-compose -f docker-compose.dev.yml logs frontend
    exit /b 1
)

REM Check database
docker-compose -f docker-compose.dev.yml exec -T db pg_isready -U admin -d Nxzen >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Database is healthy
) else (
    echo ❌ Database health check failed
    docker-compose -f docker-compose.dev.yml logs db
    exit /b 1
)

echo 🎉 Development deployment completed successfully!
echo.
echo 📋 Service URLs:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:8000
echo    Database: localhost:5432
echo    Adminer:  http://localhost:8080
echo.
echo 📊 To view logs:
echo    docker-compose -f docker-compose.dev.yml logs -f
echo.
echo 🛑 To stop services:
echo    docker-compose -f docker-compose.dev.yml down
