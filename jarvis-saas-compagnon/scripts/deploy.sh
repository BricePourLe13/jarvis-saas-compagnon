#!/bin/bash

# 🚀 Script de Déploiement JARVIS SaaS Compagnon
# Usage: ./scripts/deploy.sh [environment]
# Environments: dev, staging, production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default environment
ENVIRONMENT=${1:-dev}

echo -e "${BLUE}🚀 JARVIS SaaS Compagnon - Deployment Script${NC}"
echo -e "${YELLOW}Environment: ${ENVIRONMENT}${NC}"
echo ""

# Pre-deployment checks
echo -e "${BLUE}📋 Pre-deployment checks...${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Run this script from the project root.${NC}"
    exit 1
fi

# Check if Node.js and npm are installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js is not installed${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Error: npm is not installed${NC}"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

echo -e "${GREEN}✅ Pre-checks completed${NC}"
echo ""

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm ci

# Run tests
echo -e "${BLUE}🧪 Running tests...${NC}"
npm run test

# Type checking
echo -e "${BLUE}🔍 Type checking...${NC}"
npm run type-check

# Linting
echo -e "${BLUE}🧹 Linting code...${NC}"
npm run lint

# Build locally to catch build errors early
echo -e "${BLUE}🏗️  Building locally...${NC}"
npm run build

echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""

# Deploy based on environment
case $ENVIRONMENT in
    "production")
        echo -e "${BLUE}🚀 Deploying to PRODUCTION...${NC}"
        vercel --prod --confirm
        ;;
    "staging")
        echo -e "${BLUE}🚀 Deploying to STAGING...${NC}"
        vercel --target staging --confirm
        ;;
    "dev"|*)
        echo -e "${BLUE}🚀 Deploying to DEVELOPMENT...${NC}"
        vercel --confirm
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${YELLOW}📱 Check your deployment at: https://jarvis-saas-compagnon.vercel.app${NC}"
