@echo off
REM Production Deployment Script for Windows
REM ========================================

echo 🚀 Starting production deployment...

REM Load environment variables
if exist "env.production" (
    echo ✅ Environment variables will be loaded from env.production
) else (
    echo ❌ env.production file not found!
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist "logs\nginx" mkdir logs\nginx
if not exist "nginx\ssl" mkdir nginx\ssl

REM Stop existing containers
echo 🛑 Stopping existing containers...
docker-compose -f docker-compose.prod.yml down

REM Remove old images (optional)
echo 🧹 Cleaning up old images...
docker system prune -f

REM Build and start services
echo 🔨 Building and starting production services...
docker-compose -f docker-compose.prod.yml up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 60 /nobreak >nul

REM Check service health
echo 🔍 Checking service health...

REM Check backend
curl -f http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is healthy
) else (
    echo ❌ Backend health check failed
    docker-compose -f docker-compose.prod.yml logs backend
    exit /b 1
)

REM Check frontend
curl -f http://localhost >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is healthy
) else (
    echo ❌ Frontend health check failed
    docker-compose -f docker-compose.prod.yml logs frontend
    exit /b 1
)

REM Check database
docker-compose -f docker-compose.prod.yml exec -T db pg_isready -U admin -d Nxzen >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Database is healthy
) else (
    echo ❌ Database health check failed
    docker-compose -f docker-compose.prod.yml logs db
    exit /b 1
)

REM Check Redis
docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Redis is healthy
) else (
    echo ❌ Redis health check failed
    docker-compose -f docker-compose.prod.yml logs redis
    exit /b 1
)

REM Check Nginx
curl -f http://localhost/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Nginx is healthy
) else (
    echo ❌ Nginx health check failed
    docker-compose -f docker-compose.prod.yml logs nginx
    exit /b 1
)

echo 🎉 Production deployment completed successfully!
echo.
echo 📋 Service URLs:
echo    Application: http://localhost
echo    Backend API:  http://localhost/api
echo    Health Check: http://localhost/health
echo.
echo 📊 To view logs:
echo    docker-compose -f docker-compose.prod.yml logs -f
echo.
echo 🛑 To stop services:
echo    docker-compose -f docker-compose.prod.yml down
echo.
echo ⚠️  Remember to:
echo    1. Set up SSL certificates in nginx\ssl\
echo    2. Update DNS records to point to your server
echo    3. Configure firewall rules
echo    4. Set up monitoring and backups
