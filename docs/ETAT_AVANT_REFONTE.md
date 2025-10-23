# 📸 ÉTAT AVANT REFONTE - Phase 1

**Date** : 23 octobre 2025  
**Commit** : État avant démarrage Phase 1 - Sécurité

---

## 🎯 MODIFICATIONS RÉCENTES (pré-refonte)

### Corrections appliquées
1. ✅ Références `gym_members` → `gym_members_v2` (52 fichiers)
2. ✅ Colonnes manquantes ajoutées à `gym_members_v2`
3. ✅ Fonction `log_member_visit` mise à jour
4. ✅ Bug kiosk corrigé (`inputAudioFormat` → `input_audio_format`)

### Migrations BDD appliquées
- `20251023000001_create_core_tables.sql` ✅
- `20251023000002_create_memory_tables.sql` ✅
- `20251023000003_create_analytics_tables.sql` ✅
- `20251023000004_migrate_data.sql` ✅
- `20251023000005_update_rls_policies.sql` ✅
- `20251023000006_delete_old_tables.sql` ✅
- `20251023000007_add_missing_columns.sql` ✅
- `20251023000008_update_log_member_visit.sql` ✅

---

## 🚨 PROBLÈMES IDENTIFIÉS (à corriger Phase 1)

### Critique
1. **Pas d'auth sur dashboards** - Middleware vide pour `/dashboard`
2. **2 dashboards parallèles** - `/dashboard` ET `/admin` (duplication)
3. **Métriques fake** - `Math.random()` dans plusieurs dashboards
4. **Isolation faible** - Service_role bypass RLS partout

### Important
5. **Système kiosk basique** - Pas de device management propre
6. **Pas d'invitations** - `/team` page vide
7. **Tables BDD inutilisées** - `member_analytics`, `manager_alerts`, `insights_reports`

---

## 📊 STRUCTURE ACTUELLE

### Dashboards
```
/dashboard/
  ├── page.tsx (redirect vers /sentry)
  ├── sentry/
  ├── franchises/[id]/gyms/[gymId]/ (8 sous-pages)
  ├── gyms/
  ├── sessions/
  ├── members/
  ├── team/ (vide)
  └── settings/

/admin/ (duplication !)
  ├── franchises/
  ├── sessions/live/
  ├── team/
  └── monitoring/
```

### API Routes (fonctionnelles)
```
/api/voice/session (✅ device-agnostic partiel)
/api/kiosk/ (✅ fonctionnel)
/api/jarvis/tools/ (✅ 4 tools opérationnels)
/api/dashboard/ (❌ manquantes)
```

---

## 🎯 OBJECTIFS PHASE 1

### Semaine 1-2 : Sécurité + Nettoyage

1. **Middleware auth** (2 jours)
   - Protection `/dashboard` et `/admin`
   - Redirection selon rôle
   - Tests E2E

2. **Fusion `/admin` → `/dashboard`** (3 jours)
   - Supprimer duplication
   - Structure unifiée
   - Redirects 301

3. **RLS strict** (2 jours)
   - Helpers sécurisés
   - Isolation par gym_id
   - Audit logs

---

## 📁 FICHIERS À MODIFIER (Phase 1)

### Middleware
- `src/middleware.ts` ← **REFAIRE COMPLÈTEMENT**

### Structure dossiers
- `src/app/admin/` ← **SUPPRIMER** (fusionner dans dashboard)
- `src/app/dashboard/` ← **RESTRUCTURER**

### Lib sécurité (nouveaux)
- `src/lib/auth-helpers.ts` ← **CRÉER**
- `src/lib/secure-queries.ts` ← **CRÉER**
- `src/lib/audit-logger.ts` ← **CRÉER**

---

## 💾 BACKUP

**Branche** : `main` (état actuel)  
**Branche refonte** : `refonte/phase-1-securite`

**Rollback possible** : Oui, à tout moment

---

**Point de départ validé** ✅  
**Prêt pour Phase 1** 🚀

