# HRMS Deployment Guide

This guide covers deploying the HRMS application in both development and production environments using Docker.

## 📋 Prerequisites

- Docker and Docker Compose installed
- Git (for cloning the repository)
- Basic knowledge of Docker and environment variables

## 🏗️ Project Structure

```
hrms/
├── Backend/
│   ├── Dockerfile.dev          # Development Backend Dockerfile
│   ├── Dockerfile.prod         # Production Backend Dockerfile
│   └── ...
├── Frontend/
│   ├── Dockerfile.dev          # Development Frontend Dockerfile
│   ├── Dockerfile.prod         # Production Frontend Dockerfile
│   └── ...
├── nginx/
│   └── nginx.conf              # Production Nginx configuration
├── scripts/
│   ├── deploy-dev.sh           # Development deployment script
│   └── deploy-prod.sh          # Production deployment script
├── docker-compose.dev.yml      # Development Docker Compose
├── docker-compose.prod.yml     # Production Docker Compose
├── env.development             # Development environment variables
├── env.production              # Production environment variables
└── DEPLOYMENT.md               # This file
```

## 🚀 Quick Start

### Development Environment

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hrms
   ```

2. **Configure environment variables**
   ```bash
   cp env.development .env
   # Edit .env with your specific values
   ```

3. **Deploy development environment**
   ```bash
   chmod +x scripts/deploy-dev.sh
   ./scripts/deploy-dev.sh
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Database Admin: http://localhost:8080

### Production Environment

1. **Configure environment variables**
   ```bash
   cp env.production .env
   # Edit .env with your production values
   ```

2. **Deploy production environment**
   ```bash
   chmod +x scripts/deploy-prod.sh
   ./scripts/deploy-prod.sh
   ```

3. **Access the application**
   - Application: http://localhost (or your domain)
   - Backend API: http://localhost/api

## 🔧 Environment Configuration

### Development Environment Variables

Key variables in `env.development`:

```bash
# Application
NODE_ENV=development
ENVIRONMENT=development

# Ports
BACKEND_PORT=8000
FRONTEND_PORT=3000
POSTGRES_PORT=5432

# Database
POSTGRES_USER=admin
POSTGRES_PASSWORD=nxzen@123
POSTGRES_DB=Nxzen

# Debug
DEBUG=true
RELOAD=true
LOG_LEVEL=DEBUG
```

### Production Environment Variables

Key variables in `env.production`:

```bash
# Application
NODE_ENV=production
ENVIRONMENT=production

# Ports
BACKEND_PORT=8000
FRONTEND_PORT=80
POSTGRES_PORT=5432

# Database (use strong passwords!)
POSTGRES_PASSWORD=your-secure-production-password
REDIS_PASSWORD=your-redis-password

# Security
JWT_SECRET_KEY=your-super-secure-jwt-key
SECRET_KEY=your-super-secure-secret-key

# Debug
DEBUG=false
RELOAD=false
LOG_LEVEL=INFO
```

## 🐳 Docker Services

### Development Services

- **Backend**: FastAPI with auto-reload
- **Frontend**: React with hot reload
- **Database**: PostgreSQL 15
- **Redis**: For caching and sessions
- **Adminer**: Database administration tool

### Production Services

- **Backend**: FastAPI with multiple workers
- **Frontend**: React built and served by Nginx
- **Database**: PostgreSQL 15 with persistence
- **Redis**: For caching and sessions
- **Nginx**: Reverse proxy with load balancing

## 📊 Monitoring and Health Checks

### Health Check Endpoints

- Backend: `http://localhost:8000/health`
- Frontend: `http://localhost:3000` (dev) or `http://localhost` (prod)
- Database: Internal health checks
- Redis: Internal health checks

### Viewing Logs

```bash
# Development
docker-compose -f docker-compose.dev.yml logs -f

# Production
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

## 🔒 Security Considerations

### Production Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secret keys
- [ ] Configure SSL certificates
- [ ] Set up firewall rules
- [ ] Enable database encryption
- [ ] Configure backup strategies
- [ ] Set up monitoring and alerting
- [ ] Regular security updates

### SSL Configuration

1. Place SSL certificates in `nginx/ssl/`
2. Update Nginx configuration for HTTPS
3. Configure automatic redirects from HTTP to HTTPS

## 🗄️ Database Management

### Backup Database

```bash
# Development
docker-compose -f docker-compose.dev.yml exec db pg_dump -U admin Nxzen > backup_dev.sql

# Production
docker-compose -f docker-compose.prod.yml exec db pg_dump -U admin Nxzen > backup_prod.sql
```

### Restore Database

```bash
# Development
docker-compose -f docker-compose.dev.yml exec -T db psql -U admin Nxzen < backup_dev.sql

# Production
docker-compose -f docker-compose.prod.yml exec -T db psql -U admin Nxzen < backup_prod.sql
```

## 🔄 Updates and Maintenance

### Updating the Application

1. **Pull latest changes**
   ```bash
   git pull origin main
   ```

2. **Rebuild and restart services**
   ```bash
   # Development
   docker-compose -f docker-compose.dev.yml up --build -d

   # Production
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

### Database Migrations

```bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**
   - Check if ports are already in use
   - Modify port numbers in environment files

2. **Database connection issues**
   - Verify database credentials
   - Check if database container is running
   - Ensure database is fully initialized

3. **Permission issues**
   - Check file permissions
   - Ensure Docker has proper access

4. **Memory issues**
   - Increase Docker memory limits
   - Optimize application settings

### Debug Commands

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check container logs
docker-compose -f docker-compose.prod.yml logs backend

# Access container shell
docker-compose -f docker-compose.prod.yml exec backend bash

# Check resource usage
docker stats
```

## 📞 Support

For issues and questions:

1. Check the logs for error messages
2. Verify environment configuration
3. Ensure all prerequisites are met
4. Check Docker and Docker Compose versions

## 📝 Additional Notes

- Development environment includes hot reload for faster development
- Production environment is optimized for performance and security
- All services include health checks for monitoring
- Database data is persisted using Docker volumes
- Nginx provides load balancing and SSL termination in production
