# 🚀 Script de Déploiement JARVIS SaaS Compagnon (PowerShell)
# Usage: .\scripts\deploy.ps1 [environment]
# Environments: dev, staging, production

param(
    [string]$Environment = "dev"
)

# Colors for output
$Red = "Red"
$Green = "Green" 
$Yellow = "Yellow"
$Blue = "Cyan"

Write-Host "🚀 JARVIS SaaS Compagnon - Deployment Script" -ForegroundColor $Blue
Write-Host "Environment: $Environment" -ForegroundColor $Yellow
Write-Host ""

# Pre-deployment checks
Write-Host "📋 Pre-deployment checks..." -ForegroundColor $Blue

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Run this script from the project root." -ForegroundColor $Red
    exit 1
}

# Check if Node.js and npm are installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor $Green
} catch {
    Write-Host "❌ Error: Node.js is not installed" -ForegroundColor $Red
    exit 1
}

try {
    $npmVersion = npm --version
    Write-Host "✅ npm: $npmVersion" -ForegroundColor $Green
} catch {
    Write-Host "❌ Error: npm is not installed" -ForegroundColor $Red
    exit 1
}

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI: $vercelVersion" -ForegroundColor $Green
} catch {
    Write-Host "⚠️  Vercel CLI not found. Installing..." -ForegroundColor $Yellow
    npm install -g vercel
}

Write-Host "✅ Pre-checks completed" -ForegroundColor $Green
Write-Host ""

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor $Blue
npm ci

# Run tests
Write-Host "🧪 Running tests..." -ForegroundColor $Blue
npm run test

# Type checking  
Write-Host "🔍 Type checking..." -ForegroundColor $Blue
npm run type-check

# Linting
Write-Host "🧹 Linting code..." -ForegroundColor $Blue
npm run lint

# Build locally to catch build errors early
Write-Host "🏗️  Building locally..." -ForegroundColor $Blue
npm run build

Write-Host "✅ All checks passed!" -ForegroundColor $Green
Write-Host ""

# Deploy based on environment
switch ($Environment) {
    "production" {
        Write-Host "🚀 Deploying to PRODUCTION..." -ForegroundColor $Blue
        vercel --prod --confirm
    }
    "staging" {
        Write-Host "🚀 Deploying to STAGING..." -ForegroundColor $Blue
        vercel --target staging --confirm
    }
    default {
        Write-Host "🚀 Deploying to DEVELOPMENT..." -ForegroundColor $Blue
        vercel --confirm
    }
}

Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor $Green
Write-Host "📱 Check your deployment at: https://jarvis-saas-compagnon.vercel.app" -ForegroundColor $Yellow
