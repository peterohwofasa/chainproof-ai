#!/bin/bash

# ChainProof AI - Production Deployment Script
# This script automates the deployment process

set -e  # Exit on any error

echo "🚀 Starting ChainProof AI Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_warning ".env.production file not found."
    print_warning "Please copy .env.production.example to .env.production and configure it."
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Install dependencies
print_status "Installing dependencies..."
npm ci --production

# Run linting
print_status "Running code quality checks..."
npm run lint
if [ $? -ne 0 ]; then
    print_error "Linting failed. Please fix the issues before deploying."
    exit 1
fi

# Build the application
print_status "Building application..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Build failed. Please check the errors above."
    exit 1
fi

# Database setup (if DATABASE_URL is configured)
if [ ! -z "$DATABASE_URL" ]; then
    print_status "Setting up database..."
    npm run db:push
    if [ $? -ne 0 ]; then
        print_error "Database setup failed."
        exit 1
    fi
else
    print_warning "DATABASE_URL not set. Skipping database setup."
fi

# Health check
print_status "Running health check..."
if [ -f ".next/server/app/api/health/route.js" ]; then
    print_status "Health endpoint built successfully."
else
    print_error "Health endpoint not found in build."
    exit 1
fi

# Create production startup script
print_status "Creating production startup script..."
cat > start-production.sh << 'EOF'
#!/bin/bash

# Production startup script for ChainProof AI

echo "🚀 Starting ChainProof AI in production mode..."

# Load environment variables
if [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo "⚠️  .env.production file not found. Using default environment."
fi

# Start the application
npm start
EOF

chmod +x start-production.sh

# Success message
print_status "✅ Deployment preparation completed successfully!"
echo
echo "📋 Next steps:"
echo "1. Configure your production environment variables in .env.production"
echo "2. Set up your production database"
echo "3. Deploy to your chosen platform (Vercel, Docker, etc.)"
echo "4. Run post-deployment tests"
echo
echo "🚀 Your ChainProof AI platform is ready for production!"
echo
echo "📖 For detailed deployment instructions, see: DEPLOYMENT.md"