# 🎯 PROCHAINES ÉTAPES - JARVIS SaaS

**Date :** 25 octobre 2025  
**Status actuel :** Workspace nettoyé, prêt pour fondations

---

## ✅ TERMINÉ

### Phase 0 : Audit & Nettoyage ✅
- [x] Audit exhaustif 269 fichiers
- [x] Nettoyage 52 fichiers obsolètes
- [x] 25 docs archivés
- [x] -13,617 lignes de code obsolète supprimées
- [x] Workspace propre et structuré

---

## 🚀 PHASE 1 : FONDATIONS BDD (2 jours) - PRIORITÉ IMMÉDIATE

### Objectif
Corriger les problèmes critiques de la base de données pour permettre le fonctionnement complet du système.

### Tâches

#### 1.1 Créer table `kiosks` propre (2-3h)
```sql
CREATE TABLE kiosks (
  id UUID PRIMARY KEY,
  gym_id UUID REFERENCES gyms(id),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  provisioning_code TEXT UNIQUE,
  status TEXT CHECK (status IN ('online', 'offline', 'error', 'provisioning')),
  last_heartbeat TIMESTAMPTZ,
  device_id TEXT,
  hardware_info JSONB,
  voice_model TEXT DEFAULT 'alloy',
  openai_model TEXT DEFAULT 'gpt-4o-mini-realtime-preview-2024-12-17',
  location_in_gym TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Bénéfices :**
- ✅ Gérer plusieurs kiosks par gym
- ✅ Page `/dashboard/kiosk` fonctionnelle
- ✅ Provisioning professionnel
- ✅ Monitoring précis

#### 1.2 Migrer données existantes (1h)
```sql
-- Extraire kiosks depuis gyms.kiosk_config
INSERT INTO kiosks (gym_id, slug, provisioning_code, ...)
SELECT ...
FROM gyms
WHERE kiosk_config IS NOT NULL;
```

#### 1.3 Créer trigger `process_session_end` (2h)
```sql
CREATE FUNCTION process_session_end() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.state = 'closed' AND OLD.state = 'active' THEN
    INSERT INTO conversation_summaries (session_id, member_id, gym_id, ...)
    VALUES (NEW.session_id, NEW.member_id, NEW.gym_id, ...);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Bénéfices :**
- ✅ Conversations enregistrées automatiquement
- ✅ Insights/recommandations possibles
- ✅ Rapports automatiques

#### 1.4 Setup jobs cron (3h)
- **Job 1 :** `calculate-churn-risk` (quotidien 2h)
- **Job 2 :** `generate-churn-alerts` (quotidien 3h)
- **Job 3 :** `generate-weekly-reports` (hebdo lundi 8h)

**Options :**
- Supabase pg_cron (gratuit)
- Upstash QStash (payant, plus flexible)

**Bénéfices :**
- ✅ Alertes churn automatiques
- ✅ Rapports hebdomadaires
- ✅ Insights IA générés

#### 1.5 Nettoyer redondances BDD (1h)
```sql
-- Supprimer colonnes redondantes
ALTER TABLE users DROP COLUMN franchise_access;
ALTER TABLE users DROP COLUMN gym_access;
-- Garder uniquement franchise_id et gym_id
```

---

## 🏢 PHASE 2 : DASHBOARD ADMIN (3 jours)

### Objectif
Créer un dashboard super_admin professionnel pour gérer le SaaS.

### Décision clé : Template ou From Scratch ?

#### Option A : TailAdmin Pro ($49) ⭐ RECOMMANDÉ
**Avantages :**
- ✅ Dashboard complet (10+ pages)
- ✅ Multi-rôles natif
- ✅ Drill-down navigation
- ✅ Gain de temps : 5-7 jours
- ✅ ROI immédiat (économie 6-8k€ de dev)

**Inconvénients :**
- ❌ Coût : $49 one-time

**Temps estimé :** 3 jours

#### Option B : From Scratch (Shadcn/ui)
**Avantages :**
- ✅ Gratuit
- ✅ Contrôle total

**Inconvénients :**
- ❌ Temps : 8-10 jours de dev
- ❌ Risque bugs/incohérences

**Temps estimé :** 8-10 jours

### Pages à créer

#### Super Admin Dashboard
```
/dashboard (super_admin)
├── Vue globale SaaS
│   ├── MRR, ARR, Churn
│   ├── Clients actifs
│   ├── Coûts OpenAI/infra
│   └── Health global
│
├── /admin/clients
│   ├── Liste franchises
│   └── Liste salles indépendantes
│
├── /admin/monitoring
│   ├── Kiosks online/offline
│   ├── API health
│   └── Errors logs
│
├── /admin/users
│   ├── Créer franchise owner
│   └── Créer gym manager
│
└── /admin/support
    └── Tickets/alerts
```

---

## 🎨 PHASE 3 : POLISH (1 jour)

### Tâches
- [ ] Mini-sphère JARVIS au logo
- [ ] Tests E2E Playwright
- [ ] Documentation utilisateur
- [ ] Déploiement production

---

## 📊 RÉCAPITULATIF TIMELINE

| Phase | Durée | Priorité | Status |
|-------|-------|----------|--------|
| **Phase 0 : Audit/Nettoyage** | ✅ 1 jour | P0 | ✅ TERMINÉ |
| **Phase 1 : Fondations BDD** | 2 jours | P0 | 🔴 À FAIRE |
| **Phase 2 : Dashboard Admin** | 3 jours | P1 | ⏳ En attente |
| **Phase 3 : Polish** | 1 jour | P2 | ⏳ En attente |
| **TOTAL** | **6-7 jours** | - | **15% complété** |

---

## ❓ DÉCISIONS À PRENDRE MAINTENANT

### 1. **Phase 1 : GO immédiat ?**
- **Recommandé :** OUI
- **Raison :** Problèmes critiques bloquants
- **Durée :** 2 jours

### 2. **Jobs cron : Supabase pg_cron ou Upstash QStash ?**
- **Supabase pg_cron :** Gratuit, intégré
- **Upstash QStash :** Payant (~$10/mois), plus flexible
- **Recommandé :** Supabase pg_cron pour commencer

### 3. **Phase 2 : TailAdmin Pro ($49) ou from scratch ?**
- **Recommandé :** TailAdmin Pro
- **ROI :** Immédiat (économie 6-8k€)
- **Décision :** Après Phase 1

---

## 🎯 PROCHAINE ACTION IMMÉDIATE

**JE RECOMMANDE : Lancer Phase 1 maintenant**

1. Créer migration table `kiosks`
2. Setup trigger `process_session_end`
3. Configurer jobs cron
4. Nettoyer redondances

**Temps estimé :** 2 jours  
**Impact :** Débloquer fonctionnalités critiques

---

**Tu veux que je lance Phase 1 maintenant ? 🚀**

