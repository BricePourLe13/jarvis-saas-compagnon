#!/bin/bash

# Script de vérification post-publication
echo "🔍 Vérification de l'état du repository..."
echo ""

cd "c:\Users\zooma\Desktop\PERSO\jarvis-saas-platforrm"

# Vérifier l'état Git
echo "📊 Git Status:"
git status --porcelain

echo ""
echo "📋 Branches:"
git branch -a

echo ""
echo "🔗 Remotes:"
git remote -v

echo ""
echo "📝 Dernier commit:"
git log --oneline -1

echo ""
echo "🌐 URL du repository:"
echo "https://github.com/BricePourLe13/jarvis-compagnon.git"

echo ""
echo "✅ Vérification terminée!"
