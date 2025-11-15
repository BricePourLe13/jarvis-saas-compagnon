# ✅ CHANGEMENT DE DOMAINE TERMINÉ

**Date :** 15 novembre 2025  
**Status :** ✅ Complet

---

## 🎯 RÉSUMÉ DU CHANGEMENT

### Domaines configurés
- **SaaS (jarvis-saas-compagnon) :** `app.jarvis-group.net` ✅
- **Landing (jarvis-saas-compagnon-landing) :** `jarvis-group.net` ✅

---

## ✅ FICHIERS CORRIGÉS (7 fichiers)

### 1. **CRITIQUES** ⛔ (3 fichiers)

| Fichier | Ligne | Changement | Status |
|---------|-------|------------|--------|
| `src/app/api/dashboard/admin/gyms/route.ts` | 252 | Fallback → `app.jarvis-group.net` | ✅ |
| `src/lib/supabase-admin.ts` | 15 | Fallback → `app.jarvis-group.net` | ✅ |
| `src/middleware.ts` | 311-312 | CORS origins (app + landing) | ✅ |

### 2. **COSMÉTIQUES** 📝 (4 fichiers)

| Fichier | Ligne | Changement | Status |
|---------|-------|------------|--------|
| `src/app/api/cron/weekly-reports/route.ts` | 15 | Commentaire URL | ✅ |
| `src/app/api/cron/cleanup-old-data/route.ts` | 14 | Commentaire URL | ✅ |
| `src/app/api/cron/health-check-kiosks/route.ts` | 14 | Commentaire URL | ✅ |
| `src/app/api/cron/daily-churn-analysis/route.ts` | 14 | Commentaire URL | ✅ |

---

## 📝 FICHIERS NON MODIFIÉS (Volontairement)

Ces fichiers **ne doivent PAS** être modifiés car ils font partie de la landing page ou ont des URLs intentionnellement différentes :

| Fichier | Raison |
|---------|--------|
| `src/app/landing-client/layout.tsx` | Landing page metadata (correct : `jarvis-group.net`) |
| `src/app/page.tsx` | Landing page root (sera déplacé vers autre repo) |
| `src/app/api/admin/invitations/send/route.ts` ligne 172 | Footer email pointe vers landing (correct) |
| `src/lib/jarvis-knowledge-base.ts` | Email de contact (générique, OK) |
| `src/components/vitrine/VoiceVitrineInterface.tsx` | Email de contact (générique, OK) |
| Tests E2E | Emails de test (cosmétique, pas bloquant) |

---

## 🔧 CONFIGURATION EXTERNE EFFECTUÉE

### ✅ Supabase Auth
- URLs de callback ajoutées : `https://app.jarvis-group.net/*`
- URLs anciennes conservées temporairement pour rollback

### ✅ Vercel
- **Projet `jarvis-saas-compagnon` :**
  - Domaine ajouté : `app.jarvis-group.net`
  - `NEXT_PUBLIC_APP_URL=https://app.jarvis-group.net`
  
- **Projet `jarvis-saas-compagnon-landing` :**
  - Domaine : `jarvis-group.net`

### ✅ DNS (Squarespace)
- `app.jarvis-group.net` → Vercel (SaaS)
- `jarvis-group.net` → Vercel (Landing)

---

## 🧪 TESTS REQUIS

### Tests critiques à effectuer :

1. **Connexion/Login**
   - [ ] Login sur `https://app.jarvis-group.net/login`
   - [ ] Logout OK
   - [ ] Redirection OAuth callback OK

2. **Invitations Manager**
   - [ ] Créer une salle + inviter un manager
   - [ ] Recevoir l'email d'invitation
   - [ ] Lien d'invitation pointe vers `app.jarvis-group.net`
   - [ ] Accepter l'invitation + créer compte OK

3. **Dashboard**
   - [ ] Super admin : accès `/dashboard/admin`
   - [ ] Gym manager : accès `/dashboard/manager`
   - [ ] Navigation dashboard OK

4. **Kiosk Provisioning**
   - [ ] URL de provisioning pointe vers `app.jarvis-group.net`
   - [ ] Activation kiosk OK

5. **Landing Page**
   - [ ] `https://jarvis-group.net` accessible
   - [ ] Démo vocale fonctionne
   - [ ] Formulaire contact fonctionne

---

## 🚨 ROLLBACK (Si problème)

Si problème critique :

### Option 1 : Rollback Vercel ENV (5 min)
```bash
# Vercel Dashboard → Settings → Environment Variables
NEXT_PUBLIC_APP_URL=https://jarvis-group.net

# Redeploy
```

### Option 2 : Rollback DNS (15-60 min)
```bash
# Squarespace → Retirer CNAME app.jarvis-group.net
# Attendre propagation DNS
```

---

## 📊 FICHIERS MODIFIÉS - RÉCAP

```bash
# Fichiers critiques (3)
src/app/api/dashboard/admin/gyms/route.ts
src/lib/supabase-admin.ts
src/middleware.ts

# Fichiers cosmétiques (4)
src/app/api/cron/weekly-reports/route.ts
src/app/api/cron/cleanup-old-data/route.ts
src/app/api/cron/health-check-kiosks/route.ts
src/app/api/cron/daily-churn-analysis/route.ts

# Total : 7 fichiers modifiés
```

---

## ✅ PROCHAINES ÉTAPES

1. ✅ **Code corrigé** (fait)
2. ⏳ **Attendre propagation DNS** (15-60 min)
3. 🧪 **Tester tous les scénarios** (voir liste ci-dessus)
4. 🗑️ **Nettoyer** (après validation) :
   - Supprimer anciennes URLs Supabase Auth
   - Supprimer ancien domaine Vercel (si applicable)
   - Mettre à jour README.md

---

## 📞 CONTACT SI PROBLÈME

- **Supabase Dashboard :** https://supabase.com/dashboard
- **Vercel Dashboard :** https://vercel.com/dashboard
- **Squarespace DNS :** https://account.squarespace.com

---

**✅ CHANGEMENT TERMINÉ - PRÊT POUR TESTS**

