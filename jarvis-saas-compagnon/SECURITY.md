# 🔒 Guide de Sécurité JARVIS SaaS

## ⚠️ CONFIGURATION OBLIGATOIRE AVANT PRODUCTION

### 1. 🚨 Variables d'Environnement Vercel

**IMMÉDIATEMENT configurer dans Vercel Dashboard :**

```bash
# Settings > Environment Variables

# Supabase (OBLIGATOIRE)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_real_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_real_service_role_key

# OpenAI (OBLIGATOIRE pour IA)
OPENAI_API_KEY=sk-your_real_openai_key

# Auth (OBLIGATOIRE)
NEXTAUTH_URL=https://jarvis-saas-compagnon.vercel.app
NEXTAUTH_SECRET=generate_32_char_random_string

# App Settings
NEXT_PUBLIC_APP_URL=https://jarvis-group.net
NEXT_PUBLIC_ADMIN_EMAIL=brice@jarvis-group.net
```

### 2. 🛡️ Sécurité Supabase

**RLS Policies - État Actuel :**
- ⚠️ **RLS avec récursion infinie (42P17)**
- ✅ **Bypass intelligent implémenté** (supabase-simple.ts)
- 🔄 **Recommandation** : Réviser les policies RLS

**Actions Recommandées :**
```sql
-- 1. Vérifier les policies RLS
SELECT * FROM pg_policies WHERE tablename IN ('franchises', 'users', 'kiosk_sessions');

-- 2. Audit des permissions
SELECT grantee, privilege_type FROM information_schema.role_table_grants 
WHERE table_name IN ('franchises', 'users');
```

### 3. 🔐 Checklist Sécurité Production

#### ✅ **Fait** 
- [x] Headers sécurisés (CSP, HSTS, X-Frame-Options)
- [x] Secrets supprimés du .env.example
- [x] TypeScript strict mode
- [x] RLS bypass intelligent pour auth

#### 🔄 **À Faire**
- [ ] Rate limiting (Vercel Edge Functions)
- [ ] Monitoring d'erreurs (Sentry)
- [ ] Backup automatique Supabase
- [ ] Audit logs centralisés
- [ ] Tests sécurité automatisés

### 4. 🚨 Vulnérabilités Identifiées

#### **CRITIQUE**
1. **Exposition de secrets** (CORRIGÉ)
2. **RLS mal configuré** (CONTOURNÉ intelligemment)
3. **Pas de rate limiting** (EN COURS)

#### **ÉLEVÉ**
1. **Pas de monitoring erreurs**
2. **Logs non centralisés**
3. **Pas d'audit trail**

#### **MOYEN**
1. **CSP peut être plus restrictif**
2. **Pas de backup automatique**
3. **Tests sécurité manquants**

### 5. 🛠️ Plan de Remédiation

#### **Phase 1 - Immédiat (1-2h)**
- [x] Nettoyer secrets exposés
- [x] Headers sécurité avancés
- [ ] Configurer variables Vercel
- [ ] Test sécurité basique

#### **Phase 2 - Court terme (1 semaine)**
- [ ] Implémenter rate limiting
- [ ] Ajouter Sentry monitoring
- [ ] Audit RLS Supabase
- [ ] Tests sécurité automatisés

#### **Phase 3 - Moyen terme (1 mois)**
- [ ] Backup automatique
- [ ] Logs centralisés
- [ ] Audit trail complet
- [ ] Pentest externe

### 6. 📊 Monitoring Sécurité

**Métriques à surveiller :**
- Tentatives de connexion échouées
- Erreurs RLS 42P17
- Temps de réponse API
- Utilisation CPU/RAM anormale

**Alertes critiques :**
- Pic de 429 (rate limit)
- Erreurs 500 en série
- Tentatives d'injection SQL
- Accès non autorisé

---

## 🚀 Actions Immédiates

1. **Configurer variables Vercel** (priorité absolue)
2. **Tester l'app après config**
3. **Réviser RLS Supabase** si temps
4. **Activer monitoring basique**

**Contact Support Sécurité :** security@jarvis-compagnon.com
