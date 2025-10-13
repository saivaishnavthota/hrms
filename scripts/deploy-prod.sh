#!/bin/bash

# Production Deployment Script
# =============================

set -e

echo "🚀 Starting production deployment..."

# Load environment variables
if [ -f "env.production" ]; then
    export $(cat env.production | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded from env.production"
else
    echo "❌ env.production file not found!"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs/nginx
mkdir -p nginx/ssl

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Remove old images (optional)
echo "🧹 Cleaning up old images..."
docker system prune -f

# Build and start services
echo "🔨 Building and starting production services..."
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 60

# Check service health
echo "🔍 Checking service health..."

# Check backend
if curl -f http://localhost:${BACKEND_PORT:-8000}/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    docker-compose -f docker-compose.prod.yml logs backend
    exit 1
fi

# Check frontend
if curl -f http://localhost:${FRONTEND_PORT:-80} > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
    docker-compose -f docker-compose.prod.yml logs frontend
    exit 1
fi

# Check database
if docker-compose -f docker-compose.prod.yml exec -T db pg_isready -U admin -d Nxzen > /dev/null 2>&1; then
    echo "✅ Database is healthy"
else
    echo "❌ Database health check failed"
    docker-compose -f docker-compose.prod.yml logs db
    exit 1
fi

# Check Redis
if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis health check failed"
    docker-compose -f docker-compose.prod.yml logs redis
    exit 1
fi

# Check Nginx
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Nginx is healthy"
else
    echo "❌ Nginx health check failed"
    docker-compose -f docker-compose.prod.yml logs nginx
    exit 1
fi

echo "🎉 Production deployment completed successfully!"
echo ""
echo "📋 Service URLs:"
echo "   Application: http://localhost"
echo "   Backend API:  http://localhost/api"
echo "   Health Check: http://localhost/health"
echo ""
echo "📊 To view logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🛑 To stop services:"
echo "   docker-compose -f docker-compose.prod.yml down"
echo ""
echo "⚠️  Remember to:"
echo "   1. Set up SSL certificates in nginx/ssl/"
echo "   2. Update DNS records to point to your server"
echo "   3. Configure firewall rules"
echo "   4. Set up monitoring and backups"
