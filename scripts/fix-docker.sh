#!/bin/bash

# Fix common Docker and LocalStack issues

echo "🔧 Fixing common LocalStack/Docker issues..."

# Stop any running containers
echo "🛑 Stopping LocalStack containers..."
docker-compose down -v 2>/dev/null || stopresult=1

# Clean up Docker system
echo "🧹 Cleaning up Docker system..."
docker system prune -f 2>/dev/null || pruneresult=1

# Remove any orphaned volumes
echo "🗑️  Removing orphaned volumes..."
docker volume prune -f 2>/dev/null || volumeresult=1

# Try to start LocalStack fresh
echo "🚀 Starting LocalStack fresh..."
if docker-compose up -d; then
    echo "✅ LocalStack started successfully!"
    
    # Wait a bit for it to be ready
    sleep 10
    
    # Test connectivity
    if curl -s http://localhost:4566/health > /dev/null 2>&1; then
        echo "✅ LocalStack is responding to health checks"
        echo ""
        echo "🎉 Issues fixed! You can now run:"
        echo "   npm run stack:deploy"
        echo "   npm run demo:seed"
        echo "   npm run demo:query"
    else
        echo "⚠️  LocalStack started but health check failed"
        echo "📋 LocalStack logs:"
        docker-compose logs localstack | tail -10
    fi
else
    echo "❌ Still having issues starting LocalStack"
    echo ""
    echo "🔍 Troubleshooting steps:"
    echo "1. Make sure Docker Desktop is running"
    echo "2. Check Docker permissions in System Preferences > Security & Privacy"
    echo "3. Try restarting Docker Desktop"
    echo "4. Run: docker --version && docker-compose --version"
    echo ""
    echo "📋 System info:"
    echo "Docker version: $(docker --version 2>/dev/null || echo 'Not found')"
    echo "Docker Compose version: $(docker-compose --version 2>/dev/null || echo 'Not found')"
    echo "OS: $(uname -s)"
fi