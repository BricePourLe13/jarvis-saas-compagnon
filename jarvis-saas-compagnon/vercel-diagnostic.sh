#!/bin/bash

# Script simple pour diagnostiquer Vercel sans token
echo "🔍 Diagnostic Vercel - Tests de connectivité"
echo "⏰ $(date)"
echo ""

# Tester l'accès à l'application
echo "📊 1. Test d'accès à l'application..."
DOMAIN="https://jarvis-saas-compagnon.vercel.app"

echo "🌐 Test du domaine principal: $DOMAIN"
curl -I "$DOMAIN" 2>/dev/null | head -5
echo ""

# Tester différentes URLs
echo "📊 2. Test des pages spécifiques..."
PAGES=("/" "/dashboard" "/auth/login" "/api/health")

for page in "${PAGES[@]}"; do
    echo "🔍 Test: $DOMAIN$page"
    status=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN$page")
    echo "   Status: $status"
    
    if [ "$status" = "404" ]; then
        echo "   ❌ 404 - Page non trouvée"
    elif [ "$status" = "200" ]; then
        echo "   ✅ OK"
    elif [ "$status" = "500" ]; then
        echo "   ⚠️ Erreur serveur"
    fi
    echo ""
done

echo "📊 3. DNS et résolution..."
echo "🔍 Résolution DNS:"
nslookup jarvis-saas-compagnon.vercel.app
echo ""

echo "📊 4. Informations de déploiement Vercel..."
echo "🔍 Headers Vercel:"
curl -s -I "$DOMAIN" | grep -i vercel
echo ""

echo "✅ Diagnostic terminé !"
echo "💡 Pour un diagnostic complet, utilisez: node vercel-diagnostic.js YOUR_TOKEN"
