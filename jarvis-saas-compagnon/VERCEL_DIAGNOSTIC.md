# 🔍 DIAGNOSTIC MANUEL VERCEL - JARVIS SaaS

## ✅ Build Status
- **État**: ❌ Erreur TypeScript corrigée
- **Prochaine étape**: Redéploiement automatique

## 🔑 Variables d'Environnement Vercel
### Variables requises pour production :

```bash
# Supabase (CRITIQUE)
NEXT_PUBLIC_SUPABASE_URL=https://vurnokaxnvittopqteno.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cm5va2F4bnZpdHRvcHF0ZW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MzY5NDYsImV4cCI6MjA2ODQxMjk0Nn0.X7urH7Xv6FOPB7XpkHq137iknUAkqcGIK3EEpJ3sZaY
SUPABASE_SERVICE_ROLE_KEY=[À_CONFIGURER]

# Auth (CRITIQUE)
NEXTAUTH_SECRET=[GÉNÉRER_32_CHARS]
NEXTAUTH_URL=https://jarvis-saas-compagnon.vercel.app

# App Settings
NEXT_PUBLIC_APP_URL=https://jarvis-saas-compagnon.vercel.app
NEXT_PUBLIC_ADMIN_EMAIL=admin@jarvis-compagnon.com
```

## 🧪 Tests Disponibles

### 1. Health Check
```bash
curl https://jarvis-saas-compagnon.vercel.app/api/health
```

### 2. Rate Limiting
```bash
# Faire 6 requêtes rapides pour tester le rate limiting auth (limite: 5 req/15min)
for i in {1..6}; do
  curl -s -w "Status: %{http_code}\n" https://jarvis-saas-compagnon.vercel.app/api/auth/
done
```

### 3. Headers de Sécurité
```bash
curl -I https://jarvis-saas-compagnon.vercel.app
```

## 🚨 Problème d'Accès depuis Autre PC

### Causes Probables:
1. **Variables manquantes** → App crash → Redirection Vercel login
2. **Cache DNS/Proxy** → Résolution vers mauvaise URL
3. **Domaine custom mal configuré**
4. **Session Vercel active** → Accès preview au lieu de production

### Solutions:
1. ✅ **Vérifier variables Vercel** (priorité 1)
2. ✅ **Tester en navigation privée**
3. ✅ **Vérifier URL exacte** (pas de preview)
4. ✅ **Attendre propagation DNS** (24h max)

## 📊 API Vercel (Token: mMVrFl7nGgVBomJGVEbqsv4U)

### Endpoints utiles:
- **Projets**: GET /v9/projects
- **Déploiements**: GET /v6/deployments?projectId={id}
- **Variables env**: GET /v9/projects/{id}/env
- **Domaines**: GET /v9/projects/{id}/domains

## 🎯 Actions Immédiates

1. **Corriger build** ✅ (fait)
2. **Configurer variables Vercel** 🚨 (critique)
3. **Tester health endpoint** 🧪
4. **Vérifier accès depuis IP externe** 🌍

---

**Status Infrastructure**: 8.5/10 (dès que variables configurées)
