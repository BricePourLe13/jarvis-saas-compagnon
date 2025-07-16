#!/bin/bash

# Script d'initialisation complète pour Jarvis SaaS
echo "🚀 Initialisation de Jarvis SaaS Platform..."
echo ""

# Aller dans le répertoire du projet
cd "c:\Users\zooma\Desktop\PERSO\jarvis-saas-platforrm\jarvis\jarvis-central-server"

# Démarrer les services Docker
echo "🐳 Démarrage des services Docker (PostgreSQL & Redis)..."
docker-compose -f docker-compose.dev.yml up -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 15

# Préparer la base de données
echo "🗄️ Préparation de la base de données..."
cd database
npx prisma migrate dev --name init
npx prisma generate
cd ..

# Démarrer l'API
echo "🚀 Démarrage de l'API..."
cd api
npm install
npm run dev &
API_PID=$!

# Attendre un peu pour que l'API démarre
sleep 5

# Démarrer le dashboard admin
echo "🎨 Démarrage du dashboard admin..."
cd ../admin-dashboard
npm install
npm run dev &
DASHBOARD_PID=$!

echo ""
echo "✅ Jarvis SaaS Platform démarré avec succès!"
echo ""
echo "🔗 Services disponibles:"
echo "   - API Backend: http://localhost:3001"
echo "   - Dashboard Admin: http://localhost:3002"
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis: localhost:6379"
echo ""
echo "🛑 Pour arrêter les services:"
echo "   - Ctrl+C pour arrêter ce script"
echo "   - docker-compose -f docker-compose.dev.yml down"
echo ""

# Attendre et maintenir les processus
wait $API_PID $DASHBOARD_PID
