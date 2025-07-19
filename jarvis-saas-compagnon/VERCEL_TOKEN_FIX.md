# 🔑 RÉSOLUTION TOKENS VERCEL

## 🚨 Problème identifié
- **Token actuel** : `mMVrFl7nGgVBomJGVEbqsv4U`
- **Erreur** : "You don't have permission to list the deployment"
- **Cause** : Permissions insuffisantes

## 🛠️ Solution

### 1. Créer un nouveau token Vercel
1. Aller sur https://vercel.com/account/tokens
2. Cliquer "Create Token"
3. **Nom** : `jarvis-saas-diagnostic`
4. **Scope** : Full Account (ou spécifique au projet)
5. **Permissions** : 
   - ✅ Read deployments
   - ✅ Read projects
   - ✅ Read environment variables
   - ✅ Read domains

### 2. Test rapide du nouveau token
```bash
# Remplacer NEW_TOKEN par le nouveau token
curl -H "Authorization: Bearer NEW_TOKEN" "https://api.vercel.com/v9/projects"
```

### 3. Configuration Dashboard Vercel
- **URL** : https://vercel.com/bricepourle13/jarvis-saas-compagnon
- **Variables manquantes critiques** :
  ```
  NEXTAUTH_SECRET=générer_32_caractères_aléatoires
  NEXTAUTH_URL=https://jarvis-saas-compagnon.vercel.app
  SUPABASE_SERVICE_ROLE_KEY=récupérer_dans_supabase_dashboard
  ```

## 🧪 Test d'urgence sans token
```bash
# Test direct de l'app
curl -I https://jarvis-saas-compagnon.vercel.app

# Test de l'endpoint de base (pas /api/health)
curl https://jarvis-saas-compagnon.vercel.app/api/

# Vérification des headers de sécurité
curl -I https://jarvis-saas-compagnon.vercel.app | grep -E "(security|frame|content)"
```

## 🎯 Action immédiate
1. **Configurer variables Vercel** (priorité 1)
2. **Nouveau token** (pour diagnostic)
3. **Forcer redéploiement** après config

---
**Status** : En attente de nouveau token Vercel pour diagnostic complet
