#!/bin/bash

echo "===================================="
echo "Docker Cleanup and Rebuild Script"
echo "===================================="
echo ""

echo "Step 1: Stopping all containers..."
docker-compose down
echo ""

echo "Step 2: Removing dangling images..."
docker image prune -f
echo ""

echo "Step 3: Removing unused volumes..."
docker volume prune -f
echo ""

echo "Step 4: Removing build cache..."
docker builder prune -f
echo ""

echo "Step 5: Checking Docker disk usage..."
docker system df
echo ""

echo "===================================="
echo "Cleanup Complete!"
echo "===================================="
echo ""
echo "To rebuild, run one of these commands:"
echo "  - For development: docker-compose -f docker-compose.dev.yml up --build"
echo "  - For production: docker-compose -f docker-compose.prod.yml up --build"
echo "  - For default: docker-compose up --build"
echo ""

