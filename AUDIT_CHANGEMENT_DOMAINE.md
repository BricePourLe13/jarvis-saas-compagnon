# 🔍 AUDIT COMPLET : Changement de domaine

## 📋 Changement prévu
- **Avant :** `jarvis-group.net` (SaaS + Landing)
- **Après :** 
  - `app.jarvis-group.net` → SaaS (jarvis-saas-compagnon)
  - `jarvis-group.net` → Landing (jarvis-saas-compagnon-landing)

---

## ⚠️ IMPACTS CRITIQUES (Blocants si non corrigés)

### 1. 🔐 SUPABASE AUTH - REDIRECT URLs (CRITIQUE ⛔)

**Impact :** Les URLs de callback OAuth/Auth **doivent être configurées dans Supabase Dashboard**

**Actions requises :**
1. Aller sur Supabase Dashboard → Authentication → URL Configuration
2. **Ajouter** les nouvelles URLs (NE PAS supprimer les anciennes tout de suite) :
   ```
   https://app.jarvis-group.net
   https://app.jarvis-group.net/auth/callback
   https://app.jarvis-group.net/auth/invitation/*
   ```
3. **Tester la connexion** sur le nouveau domaine
4. **Après validation**, retirer les anciennes URLs :
   ```
   https://jarvis-group.net
   https://jarvis-group.net/auth/callback
   https://jarvis-group.net/auth/invitation/*
   ```

**Risque si non fait :** ❌ **Personne ne pourra se connecter** (erreur OAuth redirect)

---

### 2. 🌐 VERCEL - DOMAINES & ENV VARS (CRITIQUE ⛔)

**Impact :** Configuration domaines + variables d'environnement

**Actions requises :**

#### A. Domaines Vercel
1. **Projet `jarvis-saas-compagnon` :**
   - Ajouter `app.jarvis-group.net`
   - Supprimer `jarvis-group.net` (ou rediriger vers landing)

2. **Projet `jarvis-saas-compagnon-landing` (nouveau) :**
   - Ajouter `jarvis-group.net`

#### B. Variables d'environnement
**MODIFIER dans Vercel Dashboard → Settings → Environment Variables :**

```bash
# jarvis-saas-compagnon
NEXT_PUBLIC_APP_URL=https://app.jarvis-group.net  # ⚠️ CHANGER
```

**Risque si non fait :** ❌ URLs de callback, emails, liens cassés

---

### 3. 📧 EMAILS RESEND - URLs DANS LES TEMPLATES (IMPORTANT ⚠️)

**Fichiers impactés :** 3 fichiers

| Fichier | Ligne | Code actuel |
|---------|-------|-------------|
| `src/app/api/dashboard/admin/gyms/route.ts` | 252 | `${process.env.NEXT_PUBLIC_APP_URL \|\| 'https://jarvis-group.net'}/auth/invitation/${token}` |
| `src/app/api/admin/invitations/send/route.ts` | 105, 172 | `https://jarvis-group.net` |
| `src/app/api/test-resend/route.ts` | 45, 124 | `send.jarvis-group.net` (domaine email OK) |

**Actions requises :**
1. ✅ Remplacer les fallbacks `'https://jarvis-group.net'` par `'https://app.jarvis-group.net'`
2. ✅ Mettre à jour les liens hardcodés dans les templates HTML

**Risque si non fait :** ⚠️ Liens d'invitation redirigeront vers l'ancienne URL

---

### 4. 🔒 MIDDLEWARE - CORS ORIGINS (MINEUR ⚡)

**Fichier impacté :** `src/middleware.ts` ligne 311

```typescript
'https://jarvis-group.net',  // ⚠️ À remplacer par 'https://app.jarvis-group.net'
```

**Action requise :** Mettre à jour la liste CORS

**Risque si non fait :** ⚡ Erreurs CORS si appels API cross-origin

---

## 📝 IMPACTS NON BLOQUANTS (Documentation/Logs)

### 5. 📚 DOCUMENTATION

**Fichiers impactés :** 2 fichiers
- `README.md` : 6 occurrences (Site, emails, liens)
- `agent.md` : Probablement des références

**Action :** Mettre à jour après migration (pas bloquant)

---

### 6. 🧪 TESTS E2E

**Fichiers impactés :** 2 fichiers
- `tests/e2e/dashboard.spec.ts` : `admin@jarvis-group.net`
- `tests/e2e/auth.spec.ts` : `admin@jarvis-group.net`

**Action :** Mettre à jour les emails de test (pas bloquant, juste cosmétique)

---

### 7. 📊 CRON JOBS - COMMENTAIRES

**Fichiers impactés :** 4 fichiers
- `src/app/api/cron/weekly-reports/route.ts` ligne 15
- `src/app/api/cron/cleanup-old-data/route.ts` ligne 14
- `src/app/api/cron/health-check-kiosks/route.ts` ligne 14
- `src/app/api/cron/daily-churn-analysis/route.ts` ligne 14

**Action :** Mettre à jour les commentaires (URL exemple, pas bloquant)

---

### 8. 🗄️ MIGRATIONS SQL

**Fichier impacté :** `supabase/migrations/20251031000001_insert_test_data.sql` ligne 141

```sql
RAISE NOTICE '   - Accès kiosk: https://jarvis-group.net/kiosk/gym-test';
```

**Action :** Cosmétique, pas bloquant (juste un log)

---

### 9. 🌐 SEO - robots.txt & Metadata

**Fichiers impactés :** 3 fichiers
- `public/robots.txt` : Sitemap URL
- `src/app/page.tsx` : metadataBase (landing client - À SUPPRIMER car sera dans autre repo)
- `src/app/landing-client/layout.tsx` : metadata URL

**Action :** Laisser tel quel (ces fichiers seront dans le repo landing)

---

### 10. 📦 AUTRES RÉFÉRENCES (Cosmétiques)

**Fichiers impactés :** Divers
- `src/lib/jarvis-knowledge-base.ts` : Email de contact (OK)
- `src/components/vitrine/VoiceVitrineInterface.tsx` : Email de contact (OK)
- `src/lib/supabase-admin.ts` : Fallback URL (à changer)

---

## ✅ PLAN D'ACTION RECOMMANDÉ (Ordre chronologique)

### PHASE 1 : PRÉPARATION (Sans interruption)

1. ✅ **Ajouter** nouveau domaine dans Supabase Auth (garder l'ancien)
   - Dashboard Supabase → Authentication → URL Configuration
   - Ajouter : `https://app.jarvis-group.net/*`

2. ✅ **Ajouter** nouveau domaine sur Vercel
   - Projet `jarvis-saas-compagnon` → Add Domain → `app.jarvis-group.net`
   - NE PAS supprimer `jarvis-group.net` encore

3. ✅ **Mettre à jour** les variables d'environnement Vercel
   - `NEXT_PUBLIC_APP_URL=https://app.jarvis-group.net`
   - Redéployer

4. ✅ **Corriger** le code (3 fichiers critiques + 1 middleware)
   - `/api/dashboard/admin/gyms/route.ts` ligne 252
   - `/api/admin/invitations/send/route.ts` lignes 105, 172
   - `/middleware.ts` ligne 311
   - `/lib/supabase-admin.ts` ligne 15

### PHASE 2 : MIGRATION DNS

5. ✅ **Configurer DNS** chez Squarespace
   - `app.jarvis-group.net` → CNAME vers Vercel (jarvis-saas-compagnon)
   - `jarvis-group.net` → CNAME vers Vercel (jarvis-saas-compagnon-landing)

6. ✅ **Attendre propagation DNS** (15-60 minutes)

### PHASE 3 : TESTS

7. ✅ **Tester** sur `app.jarvis-group.net` :
   - Login/Logout
   - Invitation manager
   - Dashboard
   - Kiosk provisioning
   - API vocale

8. ✅ **Tester** sur `jarvis-group.net` (landing) :
   - Page d'accueil
   - Démo vocale
   - Formulaire contact

### PHASE 4 : NETTOYAGE

9. ✅ **Supprimer** anciens domaines/URLs :
   - Supabase Auth : Retirer `https://jarvis-group.net/*`
   - Vercel : Retirer `jarvis-group.net` du projet SaaS

10. ✅ **Mettre à jour documentation**
    - README.md
    - agent.md
    - Tests E2E

---

## 🚨 CHECKLIST FINALE (Avant validation)

- [ ] Supabase Auth URLs configurées (nouvelles ET anciennes)
- [ ] Domaines ajoutés sur Vercel (les 2 projets)
- [ ] `NEXT_PUBLIC_APP_URL` mis à jour
- [ ] Code corrigé (3 fichiers + middleware)
- [ ] DNS configurés chez Squarespace
- [ ] Tests login/logout OK sur nouveau domaine
- [ ] Tests invitations OK
- [ ] Tests landing page OK
- [ ] Anciennes URLs supprimées (après validation)

---

## 📊 RÉSUMÉ DES IMPACTS

| Catégorie | Nombre fichiers | Criticité | Bloquant ? |
|-----------|----------------|-----------|------------|
| Supabase Auth | Config Dashboard | ⛔ CRITIQUE | ✅ OUI |
| Vercel Config | 2 projets | ⛔ CRITIQUE | ✅ OUI |
| Emails/Invitations | 3 fichiers | ⚠️ IMPORTANT | ✅ OUI |
| Middleware CORS | 1 fichier | ⚡ MINEUR | ❌ Non |
| Documentation | 10+ fichiers | 📝 INFO | ❌ Non |

---

## ⏱️ TEMPS ESTIMÉ

- **Préparation :** 30 minutes
- **Migration DNS :** 15-60 minutes (propagation)
- **Tests :** 30 minutes
- **Nettoyage :** 15 minutes

**TOTAL :** ~2-3 heures (incluant propagation DNS)

---

## 🆘 ROLLBACK EN CAS DE PROBLÈME

Si problème critique :

1. **Supabase Auth :** Les 2 URLs sont actives (ancien + nouveau) → pas de casse
2. **Vercel :** Les 2 domaines pointent vers le SaaS → pas de casse
3. **Code :** Fallback vers `process.env.NEXT_PUBLIC_APP_URL` → configuré correctement
4. **Worst case :** Remettre `NEXT_PUBLIC_APP_URL=https://jarvis-group.net` et redéployer (5 min)

**Risque global :** 🟢 FAIBLE si suivi du plan

---

**Veux-tu que je commence à corriger les fichiers critiques maintenant ?**

