# 🚀 Guide de Déploiement JARVIS SaaS

## ✅ **PRÉ-REQUIS AVANT DÉPLOIEMENT**

### 1. Comptes Nécessaires
- ✅ **GitHub** - Code source
- ✅ **Vercel** - Hébergement & CI/CD  
- ✅ **Supabase** - Base de données & Auth
- ⚠️ **OpenAI** - API pour Kiosk JARVIS (optionnel au début)

### 2. Vérifications Locales
```bash
# Test build production
npm run build

# Test des types TypeScript
npx tsc --noEmit

# Test des tests unitaires
npm test
```

---

## 🔧 **CONFIGURATION SUPABASE**

### 1. Créer le Projet Supabase
1. **Nouveau Projet** → https://supabase.com/dashboard
2. **Configurer** : Nom, région (eu-west-1 recommandé)
3. **Attendre** la création (~3 minutes)

### 2. Exécuter les Scripts SQL
```sql
-- Dans l'éditeur SQL Supabase, exécuter dans l'ordre :

-- 1. Schéma principal
\i sql/schema-v2-franchises.sql

-- 2. Migration status
\i sql/migration-add-status-column.sql

-- 3. Fix RLS (si nécessaire)
\i sql/fix-recursion.sql
```

### 3. Récupérer les Clés
- **URL** : Settings → API → Project URL
- **Anon Key** : Settings → API → `anon public`

---

## 🚀 **DÉPLOIEMENT VERCEL**

### 1. Connexion GitHub
1. **Vercel Dashboard** → Import Project
2. **Connecter GitHub** → Sélectionner le repo
3. **Framework** : Next.js (auto-détecté)

### 2. Variables d'Environnement
```bash
# Dans Vercel Dashboard → Settings → Environment Variables

# SUPABASE (OBLIGATOIRE)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# OPENAI (Optionnel pour début)
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_OPENAI_REALTIME_URL=wss://api.openai.com/v1/realtime

# SÉCURITÉ
NEXTAUTH_SECRET=your-super-secret-key-32-chars-min
NEXTAUTH_URL=https://your-app.vercel.app

# ANALYTICS (Optionnel)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
```

### 3. Configuration CI/CD
Secrets GitHub requis :
```bash
# GitHub → Settings → Secrets and Variables → Actions

VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id  
VERCEL_PROJECT_ID=your-project-id
PRODUCTION_URL=https://your-app.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🔐 **SÉCURITÉ PRODUCTION**

### 1. Supabase RLS
```sql
-- Vérifier que RLS est activé
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Toutes les tables doivent avoir rowsecurity = true
```

### 2. Variables d'Environnement
- ✅ Jamais de clés dans le code
- ✅ Utiliser les secrets Vercel/GitHub
- ✅ Différencier dev/prod

### 3. Domaines & CORS
```bash
# Supabase → Settings → Auth → Site URL
https://your-app.vercel.app

# Additional URLs (pour dev/staging)
http://localhost:3001
https://your-app-git-develop.vercel.app
```

---

## 🧪 **TESTS POST-DÉPLOIEMENT**

### 1. Health Check
```bash
curl https://your-app.vercel.app/api/health
# Doit retourner: {"status": "ok", "timestamp": "..."}
```

### 2. Tests Fonctionnels
1. **Login** → `https://your-app.vercel.app`
2. **Navigation** → Admin → Franchises
3. **Création** → Nouvelle franchise
4. **CRUD** → Créer/Modifier salle

### 3. Performance
- **Lighthouse** → Score > 90
- **Core Web Vitals** → Vercel Analytics
- **Load Time** → < 3s première visite

---

## 🔄 **WORKFLOW DE DÉPLOIEMENT**

### Branches Strategy
```
main          → 🚀 Production automatique
develop       → 🧪 Preview deployment  
feature/*     → 🔍 PR preview
```

### Processus
```bash
# 1. Développement
git checkout -b feature/nouvelle-fonctionnalite
git push origin feature/nouvelle-fonctionnalite

# 2. Pull Request → Preview déployé automatiquement
# 3. Review & Tests
# 4. Merge vers main → Production automatique
```

---

## 🛠️ **MAINTENANCE**

### Logs & Monitoring
```bash
# Vercel Functions
vercel logs your-app

# Supabase Logs  
Dashboard → Logs → API/Auth/Database

# GitHub Actions
Repository → Actions → CI/CD Pipeline
```

### Backup & Rollback
```bash
# Rollback Vercel
vercel promote your-previous-deployment-url --prod

# Backup Supabase
Dashboard → Settings → Database → Backup
```

---

## 🚨 **TROUBLESHOOTING**

### Erreurs Communes
1. **Build Failed** → Vérifier variables env
2. **500 Supabase** → Vérifier RLS policies  
3. **404 Routes** → Vérifier middleware.ts
4. **Auth Failed** → Vérifier Site URL Supabase

### Support
- **Vercel** : https://vercel.com/help
- **Supabase** : https://supabase.com/support
- **Next.js** : https://nextjs.org/docs

---

## ✅ **CHECKLIST FINALE**

- [ ] Build local réussi
- [ ] Tests unitaires OK
- [ ] Supabase configuré + RLS activé
- [ ] Variables Vercel configurées
- [ ] Secrets GitHub configurés  
- [ ] Déploiement réussi
- [ ] Health check OK
- [ ] Tests fonctionnels OK
- [ ] Performance acceptable

**🎉 JARVIS SaaS prêt pour la production !** 