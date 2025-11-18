# ✅ CHECKLIST DÉPLOIEMENT PRODUCTION - PHASE 7

**Date :** 17 novembre 2025  
**Version :** 2.0 (Refonte complète)  
**Commit :** 1506222 (test(phase6): Validation complète migration BDD + RLS policies)

---

## 📋 PRÉ-DÉPLOIEMENT

### ✅ Code & Tests
- [x] Build local réussi (18.6min)
- [x] 0 erreurs TypeScript
- [x] 0 erreurs ESLint critiques
- [x] Tests BDD (14/14 passés)
- [x] Tests RLS (4/4 passés)
- [x] Commit + Push vers GitHub main

### ✅ Migration BDD
- [x] Migration appliquée via Supabase MCP
- [x] Schema validé (franchise_id supprimé, approval workflow ajouté)
- [x] Données existantes migrées sans perte
- [x] RLS policies vérifiées

---

## 🚀 DÉPLOIEMENT

### 1. GitHub → Vercel (Auto)
- [x] Push vers `main` effectué
- [ ] **ACTION MANUELLE** : Vérifier déploiement Vercel
  - URL : https://vercel.com/team_V1bgwQQJ2keMZvfKJ1w17JW0/jarvis-saas-compagnon
  - Attendre build completion (~8-10min)
  - Vérifier status : ✅ Ready

### 2. Variables d'Environnement Production
- [ ] **ACTION MANUELLE** : Vérifier env vars Vercel
  ```
  ✓ NEXT_PUBLIC_SUPABASE_URL
  ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
  ✓ SUPABASE_SERVICE_ROLE_KEY
  ✓ OPENAI_API_KEY
  ✓ RESEND_API_KEY
  ✓ NEXT_PUBLIC_APP_URL (https://app.jarvis-group.net)
  ✓ NEXT_PUBLIC_KIOSK_URL (si différent)
  ✓ SENTRY_DSN
  ✓ SENTRY_AUTH_TOKEN
  ```

### 3. Domaine & DNS
- [ ] **ACTION MANUELLE** : Vérifier domaine `app.jarvis-group.net`
  - DNS pointe vers Vercel
  - SSL actif
  - Redirection HTTP → HTTPS

---

## 🧪 TESTS POST-DÉPLOIEMENT (Smoke Tests)

### Test 1 : Page Login
- [ ] **ACTION MANUELLE** : Ouvrir https://app.jarvis-group.net/login
- [ ] Page charge correctement
- [ ] Design monochrome appliqué
- [ ] Pas d'erreurs console

### Test 2 : Login Super Admin
- [ ] **ACTION MANUELLE** : Login avec compte super_admin
- [ ] Redirection vers `/dashboard`
- [ ] Sidebar visible avec liens approval
- [ ] KPIs chargent correctement

### Test 3 : Pages Approval
- [ ] **ACTION MANUELLE** : Naviguer vers `/dashboard/admin/pending-gyms`
- [ ] Page charge (vide ou avec données)
- [ ] Pas d'erreurs 500
- [ ] **ACTION MANUELLE** : Naviguer vers `/dashboard/admin/pending-kiosks`
- [ ] Page charge (vide ou avec données)
- [ ] Pas d'erreurs 500

### Test 4 : API Routes
- [ ] **ACTION MANUELLE** : Tester POST `/api/admin/invitations/send`
  ```bash
  curl -X POST https://app.jarvis-group.net/api/admin/invitations/send \
    -H "Content-Type: application/json" \
    -H "Cookie: [auth_cookie]" \
    -d '{"email":"test@example.com","full_name":"Test User"}'
  ```
- [ ] Réponse 200 ou erreur auth (normal si pas de cookie)

### Test 5 : Kiosk Interface
- [ ] **ACTION MANUELLE** : Ouvrir https://app.jarvis-group.net/kiosk/[slug]
- [ ] Interface kiosk charge
- [ ] Pas d'erreurs console critiques

---

## 📊 MONITORING POST-DÉPLOIEMENT

### Sentry
- [ ] **ACTION MANUELLE** : Ouvrir https://sentry.io/jarvis-group
- [ ] Vérifier pas d'erreurs critiques (10min après deploy)
- [ ] Vérifier transactions API

### Supabase
- [ ] **ACTION MANUELLE** : Ouvrir Supabase Dashboard
- [ ] Vérifier connexions actives
- [ ] Vérifier logs API (pas d'erreurs massives)

### Vercel Analytics
- [ ] **ACTION MANUELLE** : Ouvrir Vercel Dashboard > Analytics
- [ ] Vérifier trafic normal
- [ ] Vérifier pas de 500 errors massifs

---

## 🔄 ROLLBACK (Si problème critique)

### Si erreurs 500 massives
```bash
# Revenir au commit précédent
git revert HEAD
git push origin main
# Vercel redéploiera automatiquement
```

### Si problème BDD
```sql
-- Restaurer backup Supabase
-- ⚠️ NE PAS FAIRE sans backup confirmé
```

---

## ✅ VALIDATION FINALE

### Critères de Succès
- [ ] Build Vercel : ✅ Ready
- [ ] Login fonctionne
- [ ] Dashboard charge
- [ ] Pages approval accessibles
- [ ] Pas d'erreurs Sentry critiques (>10/min)
- [ ] SSL actif
- [ ] Performance acceptable (<3s)

### Si tous les critères sont remplis
**🎉 DÉPLOIEMENT RÉUSSI ! REFONTE V2.0 EN PRODUCTION**

---

## 📝 NOTES POST-DÉPLOIEMENT

**Actions de suivi (24-48h) :**
1. Monitorer Sentry (erreurs inattendues)
2. Vérifier coûts OpenAI (pas d'explosion)
3. Tester flow complet invitation → création gym → approval
4. Collecter feedback premiers utilisateurs
5. Planifier hotfixes si nécessaire

**Prochaines features (Phase 8+) :**
- Tests E2E automatisés (Playwright)
- API tests unitaires
- Dashboard insights (ML churn)
- Mobile app (long terme)

---

**Déployé par :** Claude Sonnet 4.5  
**Validé par :** Brice (à confirmer post-smoke tests)


