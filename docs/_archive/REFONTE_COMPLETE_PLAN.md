# 🚀 PLAN DE REFONTE COMPLÈTE - JARVIS SaaS

**Date** : 23 octobre 2025  
**Version** : 1.0  
**Status** : Proposition initiale

---

## 📋 CONTEXTE COMPLET

### Vision Business

**JARVIS Voice Engine** : Agent vocal IA conversationnel pour salles de sport

**Modèle économique** :
- **Installation** : Sur devis (équipements + formation 8h + config)
- **Abonnement mensuel** : Sur devis (maintenance + support 24/7 + analytics)
- **Future** : Revenus publicitaires contextualisés (marques paient 2000€/mois/salle)

**Proposition de valeur** :
- Badge scan → Profil complet adhérent chargé
- Conversation ultra-personnalisée (objectifs, historique, préférences)
- 25 actions possibles (réservations, contacts coachs, feedback)
- Analytics ML (churn risk, satisfaction, tendances)
- Dashboard insights actionnables pour gérants

### Architecture actuelle (à refondre)

**Infrastructure** :
```
Miroir digital (salle)
    ↓ RFID scan
Badge adhérent
    ↓
Kiosk Interface (/kiosk/{slug})
    ↓
OpenAI Realtime API
    ↓
Dashboard gérant (bordélique)
```

**Stack** :
- Next.js 15 + TypeScript + Chakra UI
- OpenAI Realtime API (gpt-4o-mini)
- Supabase (PostgreSQL + RLS)
- Vercel (hosting)

**Coûts actuels** :
- OpenAI : ~€540/mois (15 kiosks)
- Infra : Vercel Free + Supabase Free

### Vision future (refonte)

**DEUX INTERFACES** :
1. **App mobile** : Membre utilise son téléphone pour parler à JARVIS
2. **Miroirs digitaux** : Kiosks physiques dans les salles (gardés)

**Migration IA** :
- Groq API (STT + LLM) : <400ms, FREE tier
- Chatterbox (TTS) : Voice cloning + émotions, €180/mois
- **Économies** : €12/kiosk/mois vs €36 actuel

---

## 🎯 OBJECTIFS DE LA REFONTE

### 1. Sécurité & Isolation ✅
- [ ] Middleware auth sur TOUTES les routes
- [ ] RLS strict ou helpers sécurisés
- [ ] Isolation données par gym_id (un gérant ne voit QUE sa salle)
- [ ] Audit logs des actions sensibles
- [ ] Device management (kiosks + mobiles)

### 2. Architecture évolutive ✅
- [ ] Support DEUX interfaces (mobile + kiosks)
- [ ] Backend unifié, agnostic du device
- [ ] Dashboard unifié avec rôles clairs
- [ ] API standardisée (RESTful)
- [ ] Système de permissions granulaires

### 3. Données & Analytics ✅
- [ ] Métriques réelles (fini les Math.random())
- [ ] Utilisation tables analytics (member_analytics, manager_alerts, insights_reports)
- [ ] Intégration ML (churn prediction, sentiment analysis)
- [ ] Rapports automatiques pour gérants

### 4. UX Niveau Entreprise ✅
- [ ] Dashboard par salle (vue isolée)
- [ ] Onboarding gérant (missions à valider)
- [ ] Système d'invitations fonctionnel
- [ ] Mobile-first (PWA ready)
- [ ] Design system cohérent

---

## 🏗️ ARCHITECTURE CIBLE

### Hiérarchie des rôles (claire)

```
super_admin (JARVIS-GROUP)
  ↓ Voit TOUT
franchise_owner
  ↓ Voit ses franchises + toutes leurs salles
gym_manager
  ↓ Voit UNIQUEMENT sa salle + ses membres
gym_staff
  ↓ Voit sa salle (lecture seule)
member
  ↓ Voit son profil uniquement (app mobile future)
```

### Structure dashboards (unifiée)

```
/app
├── (public)
│   ├── /                     ← Landing vitrine
│   ├── /login                ← Auth unique
│   └── /kiosk/[slug]         ← Interface kiosk physique
│
├── (dashboard)               ← Protégé par middleware
│   ├── layout.tsx            ← AuthGuard + RoleGuard
│   │
│   ├── /                     ← Redirect selon rôle
│   │
│   ├── (super-admin-only)/
│   │   ├── /system           ← Monitoring global
│   │   ├── /franchises       ← Liste toutes franchises
│   │   └── /analytics        ← Analytics globales
│   │
│   ├── (franchise-owner)/
│   │   └── /franchise/[id]
│   │       ├── /overview     ← Vue d'ensemble franchise
│   │       ├── /gyms         ← Liste salles franchise
│   │       └── /analytics    ← Analytics franchise
│   │
│   ├── (gym-manager)/        ← VUE PRINCIPALE
│   │   └── /gym/[id]
│   │       ├── /             ← Dashboard salle (vue unique)
│   │       ├── /members      ← Adhérents salle
│   │       ├── /sessions     ← Conversations JARVIS
│   │       ├── /analytics    ← Métriques salle
│   │       ├── /alerts       ← Alertes intelligentes
│   │       ├── /devices      ← Gestion kiosks/mobiles
│   │       └── /settings     ← Config salle
│   │
│   └── (shared)/
│       ├── /team             ← Invitations + gestion équipe
│       ├── /profile          ← Profil utilisateur
│       └── /help             ← Centre d'aide
│
└── /api
    ├── /voice                ← Sessions JARVIS
    ├── /dashboard            ← API dashboards (sécurisées)
    ├── /kiosk                ← API kiosks physiques
    └── /mobile               ← API app mobile (future)
```

### Backend unifié (device-agnostic)

**Concept** : Un seul système backend, deux interfaces frontales

```
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND UNIFIÉ                             │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           VOICE AGENT ENGINE (Core)                  │   │
│  │                                                       │   │
│  │  - Gestion sessions (kiosk OU mobile)               │   │
│  │  - Profil adhérent loading                          │   │
│  │  - RAG Context (facts + conversations)              │   │
│  │  - Tools execution (25 actions)                     │   │
│  │  - Analytics post-session                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ Device Manager │  │  Analytics   │  │   Dashboard    │ │
│  │                │  │   Engine     │  │     API        │ │
│  │ - Kiosks       │  │              │  │                │ │
│  │ - Mobiles      │  │ - ML Models  │  │ - Permissions  │ │
│  │ - Heartbeat    │  │ - Churn pred │  │ - Data agg     │ │
│  │ - Auth tokens  │  │ - Sentiment  │  │ - Real-time    │ │
│  └────────────────┘  └──────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────┘
          ↓                                      ↓
┌──────────────────────┐            ┌──────────────────────────┐
│   KIOSK INTERFACE    │            │   MOBILE APP             │
│                      │            │                          │
│ - URL: /kiosk/{slug} │            │ - React Native / PWA     │
│ - Badge RFID scan    │            │ - Auth: Email/SMS        │
│ - Standalone mode    │            │ - Notifications push     │
│ - Offline fallback   │            │ - GPS context            │
└──────────────────────┘            └──────────────────────────┘
```

**Clé** : 
- Backend ne fait AUCUNE différence entre kiosk et mobile
- Identification par `device_type` + `device_id` au lieu de `kiosk_slug`
- Kiosk = device avec `type: 'kiosk'` + `authentication: 'rfid'`
- Mobile = device avec `type: 'mobile'` + `authentication: 'jwt'`

### Système d'identification (nouveau)

**Ancienne approche** (kiosk-centric) :
```typescript
interface KioskSession {
  kiosk_slug: string        // ❌ Couplage fort
  badge_id: string
  gym_id: uuid
}
```

**Nouvelle approche** (device-agnostic) :
```typescript
interface DeviceSession {
  device_id: string         // ✅ UUID unique du device
  device_type: 'kiosk' | 'mobile' | 'web'
  device_info: {
    // Pour kiosk
    rfid_reader_id?: string
    screen_resolution?: string
    // Pour mobile
    os?: 'ios' | 'android'
    push_token?: string
    gps_enabled?: boolean
  }
  
  // Authentification adaptée
  auth_type: 'rfid' | 'jwt' | 'biometric'
  auth_payload: {
    // RFID: badge_id
    badge_id?: string
    // JWT: member_id
    member_id?: uuid
    token?: string
  }
  
  // Context
  gym_id: uuid
  franchise_id: uuid
  member_id: uuid           // Résolu après auth
}
```

**Avantages** :
- ✅ Un kiosk = un device avec ID unique
- ✅ Un mobile = un device avec ID unique
- ✅ Backend identique pour les deux
- ✅ Logs unifiés
- ✅ Analytics device-agnostic

---

## 📅 PLAN D'ACTION DÉTAILLÉ

### 🔴 PHASE 1 : FONDATIONS (Semaine 1-2) - **URGENT**

**Objectif** : Sécurité + Structure backend

#### 1.1 Middleware Authentication (2-3 jours)
```typescript
// src/middleware.ts
if (pathname.startsWith('/dashboard')) {
  const user = await getUser(request)
  if (!user) return redirect('/login')
  
  // Check role-based access
  if (isRestrictedRoute(pathname, user.role)) {
    return NextResponse.error(403)
  }
}
```

**Livrables** :
- [ ] Middleware auth complet
- [ ] Protection toutes routes `/dashboard`
- [ ] Redirection auto selon rôle
- [ ] Tests E2E authentification

#### 1.2 Device Management System (3-4 jours)
```sql
-- Table devices unifiée
CREATE TABLE devices (
  id UUID PRIMARY KEY,
  device_type TEXT CHECK (device_type IN ('kiosk', 'mobile', 'web')),
  gym_id UUID NOT NULL REFERENCES gyms(id),
  
  -- Info device
  device_info JSONB,
  last_heartbeat TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  -- Auth
  auth_type TEXT CHECK (auth_type IN ('rfid', 'jwt', 'biometric')),
  
  -- Tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  provisioned_at TIMESTAMPTZ,
  provisioned_by UUID REFERENCES users(id)
);
```

**Livrables** :
- [ ] Table `devices` créée
- [ ] Migration `kiosk_config` → `devices`
- [ ] API `/api/devices` (CRUD)
- [ ] Heartbeat system unifié
- [ ] Device provisioning flow

#### 1.3 Backend Voice Engine (device-agnostic) (2-3 jours)
```typescript
// src/lib/voice-engine/session-manager.ts
export async function createVoiceSession(params: {
  device_id: string
  member_id: uuid
  context: SessionContext
}): Promise<VoiceSession> {
  // Backend ne différencie PAS kiosk vs mobile
  // Juste device_id + member_id
}
```

**Livrables** :
- [ ] Refactor `/api/voice/session` (device-agnostic)
- [ ] Support `device_type` + `device_id`
- [ ] Backward compatibility avec `kiosk_slug` (temporaire)
- [ ] Tests unitaires

#### 1.4 RLS Strict + Helpers sécurisés (1-2 jours)
```typescript
// src/lib/secure-query.ts
export async function getGymData(gymId: uuid, userId: uuid) {
  // Vérifie TOUJOURS que user a accès à gym
  const hasAccess = await checkGymAccess(userId, gymId)
  if (!hasAccess) throw new ForbiddenError()
  
  return supabase.from('gyms').select('*').eq('id', gymId).single()
}
```

**Livrables** :
- [ ] Helpers sécurisés pour toutes les queries sensibles
- [ ] RLS policies strictes (même en service_role)
- [ ] Audit logs (table `audit_trail`)
- [ ] Tests sécurité

---

### 🟠 PHASE 2 : DASHBOARDS (Semaine 3-5) - **IMPORTANT**

**Objectif** : Dashboard unifié avec isolation stricte par salle

#### 2.1 Unification `/dashboard` (supprimer `/admin`) (2-3 jours)
```
Migrations :
/admin/franchises → /dashboard/(super-admin-only)/franchises
/admin/sessions/live → /dashboard/(shared)/sessions
/admin/team → /dashboard/(shared)/team
```

**Livrables** :
- [ ] Nouvelle structure dossiers
- [ ] Redirects 301 anciennes routes
- [ ] Layout unifié avec guards
- [ ] Navigation adaptative (selon rôle)

#### 2.2 Dashboard Salle (Vue principale gym_manager) (5-7 jours)
```typescript
// /dashboard/gym/[id]/page.tsx
export default function GymDashboard({ params }) {
  // ✅ Vue isolée : UNIQUEMENT cette salle
  // ✅ Métriques réelles (pas Math.random())
  // ✅ Alerts intelligentes (manager_alerts)
  // ✅ Quick actions (créer mission, inviter staff)
}
```

**Sections dashboard salle** :
1. **Overview** (page principale)
   - Métriques clés (membres actifs, sessions today, churn risk)
   - Alertes urgentes (top 3)
   - Quick actions
   - Graphiques tendances

2. **Members** (`/members`)
   - Liste adhérents salle
   - Filtres (churn risk, dernière visite, objectifs)
   - Fiches détaillées
   - Exports CSV

3. **Sessions** (`/sessions`)
   - Conversations JARVIS (real-time)
   - Transcripts
   - Analytics sentiments
   - Durée moyenne

4. **Alerts** (`/alerts`) ← **NOUVEAU**
   - Table `manager_alerts` affichée
   - Tri par priorité (urgent → low)
   - Actions recommandées par IA
   - Résolution + notes

5. **Devices** (`/devices`) ← **NOUVEAU**
   - Liste kiosks + mobiles (futurs)
   - Status (online/offline)
   - Heartbeat monitoring
   - Provisioning

6. **Analytics** (`/analytics`)
   - Graphiques avancés
   - Exports rapports
   - Insights IA
   - Prédictions churn

7. **Settings** (`/settings`)
   - Config JARVIS (voix, modèle)
   - Branding (couleurs, logo)
   - Horaires salle
   - Intégrations

**Livrables** :
- [ ] 7 pages dashboard salle créées
- [ ] Composants réutilisables (DashboardCard, MetricCard, AlertCard)
- [ ] Isolation stricte (RLS + helpers)
- [ ] Métriques réelles (queries optimisées)
- [ ] Tests E2E dashboard gérant

#### 2.3 Système d'invitations (Team) (2-3 jours)
```typescript
// /dashboard/(shared)/team
- Inviter un staff (role: gym_staff)
- Inviter un gérant (role: gym_manager)
- Gérer permissions
- Révoquer accès
```

**Livrables** :
- [ ] Page `/team` fonctionnelle
- [ ] API `/api/invitations` (send, resend, revoke)
- [ ] Emails invitations (Resend)
- [ ] Flow complet (invitation → acceptation → accès)

#### 2.4 Métriques réelles (fini les Math.random()) (2-3 jours)
```typescript
// Calcul des métriques depuis BDD
const metrics = {
  active_members: await countActiveMembers(gymId),
  sessions_today: await countSessionsToday(gymId),
  avg_duration: await avgSessionDuration(gymId, '7d'),
  churn_risk_high: await countChurnRisk(gymId, 'high'),
  satisfaction_score: await avgSentiment(gymId, '30d')
}
```

**Livrables** :
- [ ] Fonctions calcul métriques (src/lib/metrics/)
- [ ] Cache Redis (Upstash) pour perf
- [ ] Refresh automatique (background jobs)
- [ ] Tests unitaires métriques

---

### 🟡 PHASE 3 : MOBILE PREP (Semaine 6-7) - **SOUHAITABLE**

**Objectif** : Préparer backend pour app mobile (sans développer l'app)

#### 3.1 API Mobile (`/api/mobile`) (3-4 jours)
```typescript
// src/app/api/mobile/auth/route.ts
POST /api/mobile/auth/login
  Body: { email, password }
  Response: { access_token, refresh_token, member_id }

POST /api/mobile/session/start
  Headers: Authorization: Bearer {token}
  Body: { device_id, device_info }
  Response: { session_id, openai_session }

GET /api/mobile/profile
  Headers: Authorization: Bearer {token}
  Response: { member_profile, fitness_goals, preferences }
```

**Livrables** :
- [ ] Routes API mobile complètes
- [ ] Auth JWT (access + refresh tokens)
- [ ] Device registration flow
- [ ] Push notifications setup (future)
- [ ] Documentation API (OpenAPI spec)

#### 3.2 PWA (Progressive Web App) (2-3 jours)
```typescript
// public/manifest.json
{
  "name": "JARVIS Compagnon",
  "short_name": "JARVIS",
  "theme_color": "#2563eb",
  "background_color": "#ffffff",
  "display": "standalone",
  "scope": "/",
  "start_url": "/mobile",
  "icons": [...]
}
```

**Livrables** :
- [ ] PWA manifest configuré
- [ ] Service worker (offline support)
- [ ] Interface mobile-first (`/mobile`)
- [ ] Tests responsive (iOS + Android)

---

### 🟢 PHASE 4 : ANALYTICS & ML (Semaine 8-9) - **POLISH**

**Objectif** : Utiliser les tables analytics + intégrer ML

#### 4.1 Intégration tables analytics (2-3 jours)
```typescript
// Utiliser member_analytics, manager_alerts, insights_reports
const alerts = await getManagerAlerts(gymId, { status: 'pending' })
const insights = await getLatestInsights(gymId, 'weekly_digest')
const churnMembers = await getChurnRiskMembers(gymId, { threshold: 0.7 })
```

**Livrables** :
- [ ] Affichage `manager_alerts` dans dashboard
- [ ] Génération `insights_reports` automatique
- [ ] Calcul `member_analytics` post-session
- [ ] Notifications gérant (email + dashboard)

#### 4.2 ML Models (churn + sentiment) (3-4 jours)
```python
# Modèles ML simples mais crédibles
- XGBoost pour churn prediction
- CamemBERT pour sentiment analysis français
```

**Livrables** :
- [ ] Scripts Python ML (séparés du Next.js)
- [ ] API `/api/ml/predict-churn`
- [ ] API `/api/ml/analyze-sentiment`
- [ ] Background jobs (calcul nocturne)
- [ ] Métriques ML (accuracy, precision, recall)

---

## 🎨 DESIGN SYSTEM

### Composants réutilisables (Chakra UI + Tailwind)

```typescript
// src/components/dashboard/
- DashboardCard.tsx        // Card générique dashboard
- MetricCard.tsx           // Affichage métrique avec trend
- AlertCard.tsx            // Carte alerte (urgent, warning, info)
- MemberCard.tsx           // Carte adhérent (avec churn badge)
- SessionCard.tsx          // Carte conversation JARVIS
- DeviceCard.tsx           // Carte device (kiosk/mobile)
- GraphCard.tsx            // Graphique (recharts/visx)
```

### Palette couleurs

```typescript
const theme = {
  brand: {
    primary: '#2563eb',      // Bleu JARVIS
    secondary: '#1e40af',
    accent: '#3b82f6'
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4'
  },
  churn: {
    low: '#10b981',          // Vert
    medium: '#f59e0b',       // Orange
    high: '#ef4444',         // Rouge
    critical: '#dc2626'      // Rouge foncé
  }
}
```

---

## 📊 MÉTRIQUES DE SUCCÈS

### Phase 1 (Fondations)
- [ ] 100% routes dashboards protégées
- [ ] 0 fuite de données entre salles (tests sécu)
- [ ] Heartbeat system <2% offline time
- [ ] Device provisioning <5min

### Phase 2 (Dashboards)
- [ ] Dashboard salle <1s load time
- [ ] 100% métriques réelles (0 Math.random())
- [ ] Invitations email <95% delivered
- [ ] RLS queries <100ms p95

### Phase 3 (Mobile prep)
- [ ] API mobile <200ms response time
- [ ] PWA Lighthouse score >90
- [ ] Auth JWT refresh <50ms
- [ ] Documentation API complète

### Phase 4 (Analytics)
- [ ] Churn prediction accuracy >75%
- [ ] Sentiment analysis F1-score >0.8
- [ ] Background jobs <10min execution
- [ ] Alertes gérant <5min latency

---

## 💰 ESTIMATION EFFORT

| Phase | Durée | Complexité | Priorité |
|-------|-------|------------|----------|
| Phase 1 - Fondations | 2 semaines | Élevée | 🔴 Critique |
| Phase 2 - Dashboards | 3 semaines | Moyenne | 🟠 Importante |
| Phase 3 - Mobile prep | 2 semaines | Moyenne | 🟡 Souhaitable |
| Phase 4 - Analytics | 2 semaines | Élevée | 🟢 Polish |
| **TOTAL** | **9 semaines** | - | - |

**Ressources** : 1 dev fullstack senior (vous + moi en support)

---

## 🚧 RISQUES & MITIGATION

### Risque 1 : Migration devices en production
**Impact** : Kiosks actuels cassés pendant migration  
**Mitigation** : 
- Migration progressive (device par device)
- Backward compatibility `kiosk_slug` → 2 semaines
- Rollback plan préparé

### Risque 2 : Performance dashboards (requêtes complexes)
**Impact** : Dashboards lents (>2s load)  
**Mitigation** :
- Cache Redis (Upstash)
- Indexes BDD optimisés
- Background jobs pour métriques lourdes
- Pagination + lazy loading

### Risque 3 : Coût OpenAI (si migration Groq retardée)
**Impact** : €540/mois pendant refonte  
**Mitigation** :
- Limiter sessions vitrine (démo)
- Rate limiting strict
- Migration Groq en parallèle (Phase 1.5)

---

## ✅ CHECKLIST AVANT DE COMMENCER

### Validation client (vous)
- [ ] Budget approuvé (temps dev)
- [ ] Priorités validées (Phase 1 → 4)
- [ ] Vision mobile confirmée (PWA ou native ?)
- [ ] Deadline production (si applicable)

### Validation technique
- [ ] Backup BDD complet
- [ ] Environnement staging configuré
- [ ] Tests E2E setup (Playwright)
- [ ] Monitoring configuré (Sentry)

### Validation business
- [ ] Plan communication clients existants
- [ ] Migration kiosks physiques planifiée
- [ ] Formation gérants prévue
- [ ] Support 24/7 pendant migration

---

## 🎯 PROCHAINES ÉTAPES

1. **Validation plan** : Vous validez ce plan ou proposez ajustements
2. **Création branches** : `refonte/phase-1-fondations`, etc.
3. **Setup CI/CD** : Tests auto + déploiement staging
4. **Kick-off Phase 1** : Je commence middleware auth + device system

---

**FIN DU PLAN DE REFONTE**

**Questions ouvertes** :
1. PWA ou React Native pour mobile ?
2. Migration Groq en parallèle ou après refonte ?
3. Garder Chakra UI ou migrer vers Shadcn/ui ?
4. Tests E2E obligatoires ou optionnels ?

