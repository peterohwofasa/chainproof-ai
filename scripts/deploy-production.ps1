# ChainProof AI Production Deployment Script (Windows PowerShell)
# This script sets up the production environment with PostgreSQL and Redis

param(
    [switch]$SkipBuild,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host "[DEPLOY] Starting ChainProof AI Production Deployment..." -ForegroundColor Green

# Check if Docker is installed
Write-Host "[CHECK] Checking Docker installation..." -ForegroundColor Yellow
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Docker is not installed. Please install Docker Desktop." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Docker is installed" -ForegroundColor Green

# Check if Docker Desktop is running
Write-Host "[CHECK] Checking if Docker Desktop is running..." -ForegroundColor Yellow
$dockerStatus = docker version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Docker Desktop is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    Write-Host "[INFO] You can start Docker Desktop from the Start menu or by running 'Docker Desktop' application." -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Docker Desktop is running" -ForegroundColor Green

# Check if Docker Compose is available
if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Docker Compose is not available. Please install Docker Compose." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Docker Compose is available" -ForegroundColor Green

# Create necessary directories
Write-Host "[INFO] Creating necessary directories..." -ForegroundColor Yellow
$directories = @("data\postgres", "data\redis", "logs", "backups")
foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "[CREATED] Directory: $dir" -ForegroundColor Gray
    }
}

# Check for environment file
if (!(Test-Path ".env.production")) {
    Write-Host "[WARNING] .env.production not found. Please create it with your production settings." -ForegroundColor Yellow
    Write-Host "[INFO] You can use .env.example as a template." -ForegroundColor Yellow
    exit 1
}

# Build the production image
if (!$SkipBuild) {
    Write-Host "[BUILD] Building production Docker image..." -ForegroundColor Yellow
    docker build -f Dockerfile.production -t chainproof-ai:latest .
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to build Docker image" -ForegroundColor Red
        exit 1
    }
}

# Stop existing containers if running
Write-Host "[STOP] Stopping existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.production.yml --env-file .env.production down 2>$null

# Start the production environment
Write-Host "[START] Starting production environment..." -ForegroundColor Green
docker-compose -f docker-compose.production.yml --env-file .env.production up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to start production environment" -ForegroundColor Red
    exit 1
}

# Wait for PostgreSQL to be ready
Write-Host "[WAIT] Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Run database migrations
Write-Host "[DB] Running database migrations..." -ForegroundColor Yellow
docker-compose -f docker-compose.production.yml --env-file .env.production exec app npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] Database migrations failed. This might be expected on first run." -ForegroundColor Yellow
}

# Generate Prisma client
Write-Host "[PRISMA] Generating Prisma client..." -ForegroundColor Yellow
docker-compose -f docker-compose.production.yml --env-file .env.production exec app npx prisma generate

# Check health status
Write-Host "[HEALTH] Checking application health..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Try to get health status
$healthCheckPassed = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "[OK] Application is healthy!" -ForegroundColor Green
            $healthCheckPassed = $true
            break
        }
    } catch {
        Write-Host "[WAIT] Waiting for application to be ready... (attempt $i/10)" -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
}

if (!$healthCheckPassed) {
    Write-Host "[ERROR] Application failed to start properly. Check logs:" -ForegroundColor Red
    docker-compose -f docker-compose.production.yml --env-file .env.production logs app
    if (!$Force) {
        exit 1
    }
}

# Show running containers
Write-Host "[STATUS] Production environment status:" -ForegroundColor Cyan
docker-compose -f docker-compose.production.yml --env-file .env.production ps

Write-Host ""
Write-Host "[SUCCESS] ChainProof AI Production Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Application is running at: http://localhost:3000" -ForegroundColor White
Write-Host "2. Health check endpoint: http://localhost:3000/api/health" -ForegroundColor White
Write-Host "3. PostgreSQL is running on port 5432" -ForegroundColor White
Write-Host "4. Redis is running on port 6379" -ForegroundColor White
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "- View logs: docker-compose -f docker-compose.production.yml --env-file .env.production logs -f" -ForegroundColor White
Write-Host "- Stop services: docker-compose -f docker-compose.production.yml --env-file .env.production down" -ForegroundColor White
Write-Host "- Restart services: docker-compose -f docker-compose.production.yml --env-file .env.production restart" -ForegroundColor White
Write-Host "- Database backup: docker-compose -f docker-compose.production.yml exec postgres pg_dump -U chainproof_user chainproof_db > backup.sql" -ForegroundColor White
Write-Host ""
Write-Host "Security Reminders:" -ForegroundColor Yellow
Write-Host "- Change default passwords in .env.production" -ForegroundColor White
Write-Host "- Set up SSL/TLS certificates for HTTPS" -ForegroundColor White
Write-Host "- Configure firewall rules" -ForegroundColor White
Write-Host "- Set up monitoring and alerting" -ForegroundColor White
Write-Host "- Regular database backups" -ForegroundColor White