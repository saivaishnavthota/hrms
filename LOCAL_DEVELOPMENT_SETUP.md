# Local Development Setup

This guide will help you set up the HRMS application for local development without SSL/HTTPS issues.

## Quick Start

### Option 1: Using Development Docker Compose (Recommended)

1. **Start the services:**
   ```bash
   # On Windows
   start-local.bat
   
   # On Linux/Mac
   chmod +x start-local.sh
   ./start-local.sh
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Database: localhost:5432
   - Redis: localhost:6379

### Option 2: Manual Docker Compose

1. **Set environment variables:**
   ```bash
   export BACKEND_PORT=8000
   export FRONTEND_PORT=3000
   export POSTGRES_PORT=5432
   export REDIS_PORT=6379
   export REDIS_PASSWORD=nxzen123
   export CORS_ORIGINS="http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173,http://localhost:80"
   ```

2. **Start services:**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

## Configuration Details

### Backend Configuration
- **Port:** 8000 (HTTP, no SSL)
- **API Base URL:** http://localhost:8000
- **Database:** PostgreSQL on localhost:5432
- **Redis:** localhost:6379

### Frontend Configuration
- **Port:** 3000
- **API URL:** http://localhost:8000 (HTTP, not HTTPS)
- **Hot Reload:** Enabled for development

### Database Configuration
- **Host:** localhost
- **Port:** 5432
- **Database:** Nxzen
- **Username:** admin
- **Password:** nxzen@123

## Troubleshooting

### SSL/HTTPS Errors
If you're getting SSL protocol errors:
1. Make sure you're using the development configuration
2. Check that the frontend is configured to use `http://localhost:8000` (not `https://`)
3. Verify the backend is running on port 8000

### Port Conflicts
If ports are already in use:
1. Stop other services using ports 3000, 8000, 5432, or 6379
2. Or modify the ports in `docker-compose.dev.yml`

### CORS Errors
If you get CORS errors:
1. Check that `CORS_ORIGINS` includes your frontend URL
2. Restart the backend service after changing CORS settings

## Development Features

### Hot Reload
- **Backend:** Auto-reloads when Python files change
- **Frontend:** Hot reload for React components
- **Database:** Persistent data in Docker volumes

### Debugging
- **Backend Logs:** `docker logs fastapi_app`
- **Frontend Logs:** `docker logs react_app`
- **Database Logs:** `docker logs postgres_db`

## File Structure

```
├── docker-compose.dev.yml      # Development Docker Compose
├── docker-compose.local.yml    # Alternative local setup
├── start-local.bat            # Windows startup script
├── start-local.sh             # Linux/Mac startup script
└── nginx/nginx.local.conf     # Local nginx config (if needed)
```

## Environment Variables

The development setup uses these key environment variables:

- `BACKEND_PORT=8000` - Backend HTTP port
- `FRONTEND_PORT=3000` - Frontend port
- `CORS_ORIGINS` - Allowed origins for CORS
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_PASSWORD` - Redis password

## Production vs Development

### Development (docker-compose.dev.yml)
- HTTP only (no SSL)
- Hot reload enabled
- Debug logging
- Direct port access

### Production (docker-compose.yml)
- HTTPS with SSL certificates
- Nginx reverse proxy
- Optimized builds
- Security headers

## Next Steps

1. **Start the development environment**
2. **Access http://localhost:3000** in your browser
3. **Login with your credentials**
4. **Start developing!**

The application will automatically reload when you make changes to the code.
