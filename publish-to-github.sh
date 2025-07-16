#!/bin/bash

# Script pour publier Jarvis sur GitHub
echo "🚀 Publication du projet Jarvis sur GitHub..."
echo "Repository: https://github.com/BricePourLe13/jarvis-compagnon.git"
echo ""

# Aller dans le répertoire du projet
cd "c:\Users\zooma\Desktop\PERSO\jarvis-saas-platforrm"

# Initialiser le repository Git si ce n'est pas déjà fait
if [ ! -d ".git" ]; then
    echo "📦 Initialisation du repository Git..."
    git init
    echo "✅ Repository Git initialisé"
else
    echo "📦 Repository Git déjà initialisé"
fi

# Ajouter le remote origin
echo "🔗 Configuration du remote origin..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/BricePourLe13/jarvis-compagnon.git
echo "✅ Remote origin configuré"

# Créer/mettre à jour le .gitignore
echo "📝 Création du .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/
.next/
.nuxt/
out/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
*.log

# Database
*.db
*.sqlite
*.sqlite3

# Cache
.cache/
.npm/
.yarn/
.pnpm-store/

# Coverage
coverage/
*.lcov

# Temporary files
*.tmp
*.temp
temp/
tmp/

# Docker
.dockerignore

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# yarn v2
.yarn/cache
.yarn/unplugged
.yarn/build-state.yml
.yarn/install-state.gz
.pnp.*
EOF

echo "✅ .gitignore créé"

# Ajouter tous les fichiers
echo "📁 Ajout des fichiers au repository..."
git add .
echo "✅ Fichiers ajoutés"

# Commit initial
echo "💾 Commit initial..."
git commit -m "🎯 Initial commit - Jarvis SaaS Platform

✨ Features:
- 🤖 Compagnon vocal intelligent pour salles de sport
- 📊 Dashboard admin multitenant (Gérant/Franchise/Admin)
- 🎙️ Interface conversation vocale avec OpenAI Realtime
- 💾 Backend API complet avec PostgreSQL
- 🔐 Système d'authentification sécurisé
- 📱 Interface responsive React/TypeScript
- 🐳 Configuration Docker pour déploiement

🏗️ Architecture:
- API: Node.js + Express + Prisma + PostgreSQL
- Frontend: React + TypeScript + Vite
- Vocal: OpenAI Realtime API + WebRTC
- Auth: JWT + bcrypt + middleware sécurisé
- Deploy: Docker Compose + multi-services

🎯 Vision:
Plateforme d'intelligence commerciale déguisée en compagnon vocal
qui transforme chaque conversation en data actionnable et revenus publicitaires.

💰 Modèle économique:
- Salles individuelles: 1,600€/mois
- Franchises: Revenue sharing sur publicité ciblée
- Objectif: Rendre Jarvis gratuit et profitable pour les franchises"

echo "✅ Commit créé"

# Pousser vers GitHub
echo "🚀 Push vers GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "🎉 Projet publié avec succès sur GitHub!"
echo "🔗 Repository: https://github.com/BricePourLe13/jarvis-compagnon.git"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Vérifier le repository sur GitHub"
echo "2. Ajouter une description au repository"
echo "3. Configurer les GitHub Actions si nécessaire"
echo "4. Inviter des collaborateurs si besoin"
