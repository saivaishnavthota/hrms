#!/bin/bash

# Development Deployment Script
# =============================

set -e

echo "🚀 Starting development deployment..."

# Load environment variables
if [ -f "env.development" ]; then
    export $(cat env.development | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded from env.development"
else
    echo "❌ env.development file not found!"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.dev.yml down

# Remove old images (optional)
echo "🧹 Cleaning up old images..."
docker system prune -f

# Build and start services
echo "🔨 Building and starting development services..."
docker-compose -f docker-compose.dev.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🔍 Checking service health..."

# Check backend
if curl -f http://localhost:${BACKEND_PORT:-8000}/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    docker-compose -f docker-compose.dev.yml logs backend
    exit 1
fi

# Check frontend
if curl -f http://localhost:${FRONTEND_PORT:-3000} > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
    docker-compose -f docker-compose.dev.yml logs frontend
    exit 1
fi

# Check database
if docker-compose -f docker-compose.dev.yml exec -T db pg_isready -U admin -d Nxzen > /dev/null 2>&1; then
    echo "✅ Database is healthy"
else
    echo "❌ Database health check failed"
    docker-compose -f docker-compose.dev.yml logs db
    exit 1
fi

echo "🎉 Development deployment completed successfully!"
echo ""
echo "📋 Service URLs:"
echo "   Frontend: http://localhost:${FRONTEND_PORT:-3000}"
echo "   Backend:  http://localhost:${BACKEND_PORT:-8000}"
echo "   Database: localhost:${POSTGRES_PORT:-5432}"
echo "   Adminer:  http://localhost:8080"
echo ""
echo "📊 To view logs:"
echo "   docker-compose -f docker-compose.dev.yml logs -f"
echo ""
echo "🛑 To stop services:"
echo "   docker-compose -f docker-compose.dev.yml down"
