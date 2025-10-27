#!/bin/bash

echo "Starting HRMS Local Development Environment..."

# Set environment variables for local development
export BACKEND_PORT=8000
export FRONTEND_PORT=3000
export POSTGRES_PORT=5432
export REDIS_PORT=6379
export REDIS_PASSWORD=nxzen123
export CORS_ORIGINS="http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173,http://localhost:80"

echo "Environment variables set for local development"
echo ""
echo "Starting services with docker-compose.dev.yml..."
echo ""

docker-compose -f docker-compose.dev.yml up --build
