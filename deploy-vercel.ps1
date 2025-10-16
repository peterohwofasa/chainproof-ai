# Vercel Deployment Script for ChainProof AI
# Run this script to deploy to Vercel using CLI

Write-Host "🚀 ChainProof AI - Vercel Deployment Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if Vercel CLI is installed
Write-Host "📦 Checking Vercel CLI installation..." -ForegroundColor Yellow
if (!(Get-Command "vercel" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Vercel CLI. Please install manually: npm install -g vercel" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Vercel CLI installed successfully!" -ForegroundColor Green
} else {
    Write-Host "✅ Vercel CLI is already installed" -ForegroundColor Green
}

# Check if user is logged in to Vercel
Write-Host "🔐 Checking Vercel authentication..." -ForegroundColor Yellow
vercel whoami 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Vercel. Please log in..." -ForegroundColor Red
    vercel login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to log in to Vercel" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Authenticated with Vercel" -ForegroundColor Green

# Run TypeScript check
Write-Host "🔍 Running TypeScript check..." -ForegroundColor Yellow
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  TypeScript errors found. Continuing with deployment..." -ForegroundColor Yellow
    Write-Host "   (Some errors may be from test files or dependencies)" -ForegroundColor Gray
}

# Build the project locally to check for build errors
Write-Host "🏗️  Building project locally..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Please fix build errors before deploying." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Local build successful" -ForegroundColor Green

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
Write-Host "   This will deploy to production. Make sure you have:" -ForegroundColor Gray
Write-Host "   - Set up all environment variables in Vercel dashboard" -ForegroundColor Gray
Write-Host "   - Configured your database" -ForegroundColor Gray
Write-Host "   - Set up your Base Pay recipient address" -ForegroundColor Gray

$confirmation = Read-Host "Continue with deployment? (y/N)"
if ($confirmation -ne "y" -and $confirmation -ne "Y") {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    exit 0
}

vercel --prod
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host "🎉 Your ChainProof AI application is now live!" -ForegroundColor Cyan
    Write-Host "" 
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Test your deployed application" -ForegroundColor White
    Write-Host "2. Set up your custom domain (optional)" -ForegroundColor White
    Write-Host "3. Configure monitoring and analytics" -ForegroundColor White
    Write-Host "4. Test Base Pay integration with small amounts" -ForegroundColor White
} else {
    Write-Host "❌ Deployment failed. Check the logs above for details." -ForegroundColor Red
    exit 1
}