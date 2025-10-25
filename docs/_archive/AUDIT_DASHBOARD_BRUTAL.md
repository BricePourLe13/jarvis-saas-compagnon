# 🚨 AUDIT BRUTAL - DASHBOARD SaaS ENTREPRISE

**Date :** 25 octobre 2025  
**Contexte :** Refonte dashboard Shadcn/ui - Analyse post-déploiement

---

## 🎯 CONSTAT BRUTAL

### ❌ CE QUI NE VA PAS

**1. DASHBOARD ACTUEL = GÉNÉRIQUE ET INCOMPLET**

Tu as raison : j'ai créé un "squelette esthétique" mais **NON FONCTIONNEL** pour ton SaaS.

```
❌ 4 pages créées:
  - /dashboard/overview → KPIs génériques
  - /dashboard/members-v2 → Liste membres (mais QUELLE gym?)
  - /dashboard/sessions-v2 → Sessions (mais QUELLE gym?)
  - /dashboard/analytics-v2 → Analytics (mais QUELLE gym?)
```

**PROBLÈME CRITIQUE:** Ces pages ne respectent PAS la hiérarchie métier.

---

## 🏗️ ARCHITECTURE MÉTIER RÉELLE

### Structure BDD (Supabase)

```
┌─────────────────┐
│   FRANCHISES    │ (2 franchises)
│   (Groupe)      │
└────────┬────────┘
         │
         ├─ GYM 1 (franchise_id)
         ├─ GYM 2 (franchise_id)
         └─ GYM n...
              │
              ├─ MEMBERS (gym_id)
              ├─ SESSIONS (gym_id)
              ├─ KIOSK (kiosk_slug)
              └─ ANALYTICS (gym_id)
```

### Hiérarchie des Rôles

```typescript
type UserRole = 
  | 'super_admin'      // JARVIS TEAM → voit TOUT
  | 'franchise_owner'  // Gérant franchise → voit SES franchises
  | 'gym_manager'      // Gérant salle → voit SA salle
  | 'gym_staff'        // Staff salle → accès limité
```

**BDD Actuelle:**
- **8 users** (avec roles)
- **2 franchises**
- **4 gyms**
- **12 members**

---

## ❌ PAGES SUPPRIMÉES PAR ERREUR

### Pages critiques archivées (24 pages)

```
🔴 CRITIQUES (Manquent maintenant):
├─ /dashboard/franchises                   → Liste franchises
├─ /dashboard/franchises/[id]              → Détails franchise
├─ /dashboard/franchises/[id]/gyms/[gymId] → Détails gym
├─ /dashboard/franchises/[id]/gyms/[gymId]/kiosk → Config kiosk ⚠️
├─ /dashboard/franchises/[id]/gyms/[gymId]/members → Membres gym
├─ /dashboard/franchises/[id]/gyms/[gymId]/operations → Opérations
├─ /dashboard/franchises/[id]/gyms/[gymId]/settings → Paramètres
│
🟠 UTILES:
├─ /dashboard/monitoring   → Monitoring système
├─ /dashboard/settings     → Paramètres utilisateur
├─ /dashboard/team         → Gestion équipe
├─ /dashboard/repair       → Réparation BDD
│
🟡 À RECRÉER:
├─ /dashboard/gyms         → Liste gyms (gym_manager)
├─ /dashboard/members      → Liste membres
├─ /dashboard/sessions/live → Sessions live
└─ /dashboard/issues       → Incidents
```

---

## 🎯 CE QU'IL MANQUE ACTUELLEMENT

### 1. **Navigation Hiérarchique**

**Super_admin** devrait voir:
```
/dashboard
  ├─ Vue globale (toutes franchises)
  ├─ /franchises → Liste de TOUTES les franchises
  │   └─ /franchises/[id] → Détails franchise
  │       └─ /franchises/[id]/gyms → Liste gyms franchise
  │           └─ /franchises/[id]/gyms/[gymId]
  │               ├─ Overview
  │               ├─ Members
  │               ├─ Sessions
  │               ├─ Analytics
  │               ├─ Kiosk Config ⚠️ CRITIQUE
  │               └─ Settings
  │
  └─ /admin
      ├─ Users
      ├─ Monitoring
      ├─ Repair
      └─ Logs
```

**Franchise_owner** devrait voir:
```
/dashboard
  └─ /franchises/[son_id]
      └─ /gyms → SES gyms uniquement
          └─ /gyms/[gymId]
              ├─ Overview
              ├─ Members
              ├─ Sessions
              └─ Analytics
```

**Gym_manager** devrait voir:
```
/dashboard
  └─ /gym/[son_gym_id] → SA salle uniquement
      ├─ Overview
      ├─ Members
      ├─ Sessions
      ├─ Analytics
      └─ Kiosk Status ⚠️
```

### 2. **Accès Kiosk MANQUANT**

❌ **PROBLÈME:** Aucun lien vers l'interface kiosk dans le dashboard.

**Besoin:**
```
/dashboard/gym/[gymId]
  └─ Kiosk Section:
      ├─ Status (online/offline)
      ├─ Configuration (slug, RFID, model)
      ├─ Metrics (CPU, RAM, audio quality)
      ├─ Link to interface → /kiosk/[slug]
      └─ Provisioning code
```

**Table BDD existante:** `kiosk_heartbeats`, `kiosk_metrics`

---

## 📊 DONNÉES BDD vs DASHBOARD

### Incohérences actuelles

| Page Dashboard | Données Affichées | Source BDD Réelle |
|----------------|-------------------|-------------------|
| `/dashboard/overview` | ❌ Membre **d'une gym ?** | `gym_members_v2` (pas de filtre gym_id) |
| `/dashboard/members-v2` | ❌ Tous les membres ? | `gym_members_v2` (gym_id requis) |
| `/dashboard/sessions-v2` | ❌ Sessions globales ? | `openai_realtime_sessions` (gym_id requis) |
| `/dashboard/analytics-v2` | ❌ Analytics de quoi ? | `member_analytics`, `conversation_summaries` |

**CRITIQUE:** Les 4 nouvelles pages ne sont **PAS filtrées par gym_id** !

---

## 🚀 ARCHITECTURE DASHBOARD CORRECTE

### Option 1 : HIÉRARCHIQUE (Recommandée)

```
/dashboard
  │
  ├─ [Super_admin UNIQUEMENT]
  │   ├─ /franchises (liste)
  │   ├─ /franchises/[id] (détails)
  │   ├─ /franchises/[id]/gyms (liste gyms franchise)
  │   ├─ /admin/users
  │   ├─ /admin/monitoring
  │   └─ /admin/logs
  │
  ├─ [Franchise_owner]
  │   ├─ /franchise/[id] (sa franchise)
  │   └─ /franchise/[id]/gyms (ses gyms)
  │
  └─ [Gym_manager / Tout le monde]
      └─ /gym/[gymId]
          ├─ /overview
          ├─ /members
          ├─ /sessions
          ├─ /analytics
          ├─ /kiosk → CONFIG + LINK
          └─ /settings
```

### Option 2 : CONTEXT-AWARE (Plus simple)

```
/dashboard
  │
  ├─ Détection automatique du rôle
  │   └─ Redirect vers bon contexte:
  │       ├─ Super_admin → /dashboard?view=all
  │       ├─ Franchise_owner → /dashboard?franchise=[id]
  │       └─ Gym_manager → /dashboard?gym=[id]
  │
  └─ Pages universelles (filtrées par contexte):
      ├─ /dashboard/overview (contexte auto)
      ├─ /dashboard/members (filtrés par gym_id)
      ├─ /dashboard/sessions (filtrés par gym_id)
      ├─ /dashboard/analytics (filtrés par gym_id)
      ├─ /dashboard/kiosk (si gym_manager)
      └─ /dashboard/admin (si super_admin)
```

---

## 🎨 NAVIGATION UI

### Sidebar Structure (Recommandée)

```typescript
// Super_admin
{
  sections: [
    {
      title: "Global",
      items: [
        { label: "Vue d'ensemble", icon: LayoutDashboard, href: "/dashboard" },
        { label: "Franchises", icon: Building2, href: "/dashboard/franchises" },
      ]
    },
    {
      title: "Administration",
      items: [
        { label: "Utilisateurs", icon: Users, href: "/dashboard/admin/users" },
        { label: "Monitoring", icon: Activity, href: "/dashboard/admin/monitoring" },
      ]
    }
  ]
}

// Gym_manager
{
  sections: [
    {
      title: "Ma salle",
      items: [
        { label: "Vue d'ensemble", icon: LayoutDashboard, href: "/dashboard/gym/[id]" },
        { label: "Membres", icon: Users, href: "/dashboard/gym/[id]/members" },
        { label: "Sessions JARVIS", icon: MessageSquare, href: "/dashboard/gym/[id]/sessions" },
        { label: "Analytics", icon: BarChart3, href: "/dashboard/gym/[id]/analytics" },
        { label: "Kiosk", icon: Monitor, href: "/dashboard/gym/[id]/kiosk" }, ⚠️
      ]
    },
    {
      title: "Configuration",
      items: [
        { label: "Paramètres", icon: Settings, href: "/dashboard/gym/[id]/settings" },
      ]
    }
  ]
}
```

---

## 🔧 API ROUTES EXISTANTES

### Routes Admin (OK)

```
✅ /api/admin/franchises
✅ /api/admin/franchises/[id]/gyms
✅ /api/admin/gyms/[id]
✅ /api/admin/users
✅ /api/admin/sessions
✅ /api/admin/monitoring (via activity)
```

### Routes Dashboard (MANQUANTES)

```
❌ /api/dashboard/gym/[gymId]/overview
❌ /api/dashboard/gym/[gymId]/members
❌ /api/dashboard/gym/[gymId]/sessions
❌ /api/dashboard/gym/[gymId]/analytics
❌ /api/dashboard/gym/[gymId]/kiosk
❌ /api/dashboard/franchises
❌ /api/dashboard/franchises/[id]/gyms
```

### Routes Kiosk (OK)

```
✅ /api/kiosk/[slug]
✅ /api/kiosk/[slug]/members
✅ /api/kiosk/heartbeat
✅ /kiosk/[slug] (interface)
```

---

## 🎯 PLAN DE MIGRATION COMPLET

### Phase 1: ARCHITECTURE CORRECTE (1-2 jours)

**A. Créer structure hiérarchique**

```
src/app/dashboard/
  ├─ page.tsx → Redirect basé sur rôle
  │
  ├─ franchises/
  │   ├─ page.tsx → Liste franchises (super_admin)
  │   └─ [id]/
  │       ├─ page.tsx → Détails franchise
  │       └─ gyms/
  │           ├─ page.tsx → Liste gyms franchise
  │           └─ [gymId]/ → (voir Phase 2)
  │
  ├─ gym/
  │   └─ [gymId]/
  │       ├─ page.tsx → Redirect vers overview
  │       ├─ overview/page.tsx
  │       ├─ members/page.tsx
  │       ├─ sessions/page.tsx
  │       ├─ analytics/page.tsx
  │       ├─ kiosk/page.tsx ⚠️ PRIORITÉ
  │       └─ settings/page.tsx
  │
  └─ admin/
      ├─ users/page.tsx
      ├─ monitoring/page.tsx
      ├─ logs/page.tsx
      └─ repair/page.tsx
```

**B. Créer API routes manquantes**

```
src/app/api/dashboard/
  ├─ franchises/
  │   ├─ route.ts → Liste franchises
  │   └─ [id]/
  │       ├─ route.ts → Détails franchise
  │       └─ gyms/route.ts → Gyms de la franchise
  │
  └─ gym/
      └─ [gymId]/
          ├─ overview/route.ts
          ├─ members/route.ts
          ├─ sessions/route.ts
          ├─ analytics/route.ts
          └─ kiosk/route.ts ⚠️
```

**C. Middleware RLS sécurisé**

```typescript
// src/middleware.ts
if (role === 'super_admin') {
  // Accès à TOUT
} else if (role === 'franchise_owner') {
  // Vérifier que franchise_id est dans user.franchise_access
} else if (role === 'gym_manager') {
  // Vérifier que gym_id === user.gym_id
}
```

---

### Phase 2: PAGES CRITIQUES (1 jour)

**Priorité 1: KIOSK**
```
✅ /dashboard/gym/[gymId]/kiosk/page.tsx
  ├─ Status (online/offline via kiosk_heartbeats)
  ├─ Metrics (kiosk_metrics)
  ├─ Config (gyms.kiosk_config)
  └─ Link to /kiosk/[slug]
```

**Priorité 2: GYM OVERVIEW**
```
✅ /dashboard/gym/[gymId]/overview/page.tsx
  ├─ KPIs (membres actifs, sessions, sentiment)
  ├─ Alertes (manager_alerts)
  └─ Quick actions
```

**Priorité 3: FRANCHISES (super_admin)**
```
✅ /dashboard/franchises/page.tsx
  └─ Liste + cards franchises avec stats
```

---

### Phase 3: MIGRATION ANCIENNES PAGES (2-3 jours)

**Pages à migrer vers Shadcn/ui:**

1. **Monitoring** (super_admin)
   - Metrics système
   - Health checks
   - Error logs

2. **Settings** (tous)
   - Profil utilisateur
   - Préférences
   - Sécurité (MFA)

3. **Team** (franchise_owner, super_admin)
   - Gestion équipe
   - Invitations
   - Permissions

4. **Operations** (gym_manager)
   - Horaires
   - Équipements
   - Maintenance

---

## 💰 JUSTIFICATION 1200€/MOIS

### Dashboard Actuel vs Attendu

| Feature | Actuel | Attendu Enterprise |
|---------|--------|-------------------|
| **Hiérarchie claire** | ❌ | ✅ Franchises → Gyms → Membres |
| **Accès kiosk** | ❌ | ✅ Config + monitoring + link |
| **RLS sécurisé** | ⚠️ Partiel | ✅ Strict par rôle |
| **Analytics avancées** | ⚠️ Basique | ✅ Churn prediction + insights IA |
| **Alertes intelligentes** | ❌ | ✅ Churn risk, équipements, achievements |
| **Rapports auto** | ❌ | ✅ Daily/Weekly/Monthly (insights_reports) |
| **Monitoring temps réel** | ❌ | ✅ Sessions live + kiosk heartbeat |
| **Multi-tenant** | ⚠️ Incomplet | ✅ Isolation complète par franchise |

---

## 🎯 RECOMMANDATION BRUTALE

### Ce qu'il faut faire MAINTENANT

**1. ARCHITECTURE (Week 1)**
```
✅ Créer structure /dashboard/gym/[gymId]/*
✅ Créer /dashboard/franchises pour super_admin
✅ Implémenter RLS middleware strict
✅ Créer API routes avec filtres gym_id/franchise_id
```

**2. PAGES CRITIQUES (Week 1)**
```
✅ /dashboard/gym/[gymId]/kiosk ← PRIORITÉ ABSOLUE
✅ /dashboard/gym/[gymId]/overview
✅ /dashboard/franchises (super_admin)
```

**3. MIGRATION (Week 2)**
```
✅ Migrer anciennes pages Chakra → Shadcn
✅ Ajouter analytics avancées (churn, insights)
✅ Implémenter alertes intelligentes
✅ Créer rapports automatiques
```

**4. POLISH (Week 2-3)**
```
✅ E2E tests
✅ Performance optimization
✅ Documentation complète
✅ Formation utilisateurs
```

---

## 🚨 ACTIONS IMMÉDIATES

**Pour continuer maintenant:**

1. **Tu valides l'architecture** (Option 1 hiérarchique ou Option 2 context-aware)
2. **Je crée les pages manquantes** dans l'ordre de priorité
3. **Je migre les anciennes fonctionnalités** vers le nouveau design
4. **Je teste avec tes vrais users** (super_admin, gym_manager)

---

**Status:** ⚠️ **DASHBOARD INCOMPLET - NÉCESSITE REFONTE ARCHITECTURALE**

**ETA:** 1-2 semaines pour version enterprise complète

