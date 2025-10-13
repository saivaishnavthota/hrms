#!/bin/bash

# Production Troubleshooting Script
# =================================

echo "🔍 HRMS Production Troubleshooting"
echo "=================================="

# Check if containers are running
echo "📊 Container Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🌐 Port Status:"
echo "Checking if ports are accessible..."

# Check if ports are listening
if command -v netstat >/dev/null 2>&1; then
    echo "Port 80 (Nginx):"
    netstat -tlnp | grep :80 || echo "❌ Port 80 not listening"
    
    echo "Port 2342 (Backend):"
    netstat -tlnp | grep :2342 || echo "❌ Port 2342 not listening"
    
    echo "Port 2343 (Frontend):"
    netstat -tlnp | grep :2343 || echo "❌ Port 2343 not listening"
else
    echo "netstat not available, checking with ss..."
    ss -tlnp | grep :80 || echo "❌ Port 80 not listening"
    ss -tlnp | grep :2342 || echo "❌ Port 2342 not listening"
    ss -tlnp | grep :2343 || echo "❌ Port 2343 not listening"
fi

echo ""
echo "🔍 Container Logs:"
echo "=================="

echo "Nginx logs (last 20 lines):"
docker-compose -f docker-compose.prod.yml logs --tail=20 nginx

echo ""
echo "Backend logs (last 20 lines):"
docker-compose -f docker-compose.prod.yml logs --tail=20 backend

echo ""
echo "Frontend logs (last 20 lines):"
docker-compose -f docker-compose.prod.yml logs --tail=20 frontend

echo ""
echo "🌐 Testing Connectivity:"
echo "======================="

# Test if services are responding
echo "Testing Nginx (port 80):"
curl -I http://localhost:80 2>/dev/null | head -1 || echo "❌ Nginx not responding"

echo "Testing Backend (port 2342):"
curl -I http://localhost:2342 2>/dev/null | head -1 || echo "❌ Backend not responding"

echo "Testing Frontend (port 2343):"
curl -I http://localhost:2343 2>/dev/null | head -1 || echo "❌ Frontend not responding"

echo ""
echo "📋 Environment Check:"
echo "===================="

if [ -f "env.production" ]; then
    echo "✅ env.production file exists"
    echo "Key environment variables:"
    grep -E "^(BACKEND_PORT|FRONTEND_PORT|POSTGRES_PASSWORD|REDIS_PASSWORD)" env.production | head -5
else
    echo "❌ env.production file not found!"
fi

echo ""
echo "🔧 Quick Fixes to Try:"
echo "====================="
echo "1. Check if you're accessing http://localhost (port 80)"
echo "2. Try accessing http://localhost:2343 (direct frontend)"
echo "3. Check if environment variables are set correctly"
echo "4. Restart containers: docker-compose -f docker-compose.prod.yml restart"
echo "5. Check firewall settings"
