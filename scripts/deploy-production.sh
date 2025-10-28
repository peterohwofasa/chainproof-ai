#!/bin/bash

# ChainProof AI Production Deployment Script
# This script sets up the production environment with MongoDB and Redis

set -e

echo "🚀 Starting ChainProof AI Production Deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p data/mongodb
mkdir -p data/redis
mkdir -p logs
mkdir -p backups

# Set proper permissions
chmod 755 data/mongodb
chmod 755 data/redis
chmod 755 logs
chmod 755 backups

# Copy environment file if it doesn't exist
if [ ! -f .env.production ]; then
    echo "⚠️  .env.production not found. Please create it with your production settings."
    echo "You can use .env.example as a template."
    exit 1
fi

# Build the production image
echo "🔨 Building production Docker image..."
docker build -f Dockerfile.production -t chainproof-ai:latest .

# Stop existing containers if running
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.production.yml down || true

# Start the production environment
echo "🚀 Starting production environment..."
docker-compose -f docker-compose.production.yml up -d

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 10

# Test MongoDB connection
echo "🗃️  Testing MongoDB connection..."
docker-compose -f docker-compose.production.yml exec app node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL)
  .then(() => { console.log('✅ MongoDB connected successfully'); process.exit(0); })
  .catch(err => { console.error('❌ MongoDB connection failed:', err); process.exit(1); });
"

# Check health status
echo "🏥 Checking application health..."
sleep 5

# Try to get health status
for i in {1..10}; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ Application is healthy!"
        break
    else
        echo "⏳ Waiting for application to be ready... (attempt $i/10)"
        sleep 5
    fi
    
    if [ $i -eq 10 ]; then
        echo "❌ Application failed to start properly. Check logs:"
        docker-compose -f docker-compose.production.yml logs app
        exit 1
    fi
done

# Show running containers
echo "📊 Production environment status:"
docker-compose -f docker-compose.production.yml ps

echo ""
echo "🎉 ChainProof AI Production Deployment Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Application is running at: http://localhost:3000"
echo "2. Health check endpoint: http://localhost:3000/api/health"
echo "3. MongoDB is running on port 27017"
echo "4. Redis is running on port 6379"
echo ""
echo "📝 Useful Commands:"
echo "- View logs: docker-compose -f docker-compose.production.yml logs -f"
echo "- Stop services: docker-compose -f docker-compose.production.yml down"
echo "- Restart services: docker-compose -f docker-compose.production.yml restart"
echo "- Database backup: docker-compose -f docker-compose.production.yml exec mongodb mongodump --db chainproof_db --out /data/backup"
echo ""
echo "🔒 Security Reminders:"
echo "- Change default passwords in .env.production"
echo "- Set up SSL/TLS certificates for HTTPS"
echo "- Configure firewall rules"
echo "- Set up monitoring and alerting"
echo "- Regular database backups"