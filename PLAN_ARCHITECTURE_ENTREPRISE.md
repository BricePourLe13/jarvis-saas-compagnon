# 🏗️ PLAN ARCHITECTURE ENTREPRISE - JARVIS SaaS

**Version :** 2.0  
**Date :** 25 octobre 2025  
**Statut :** 🎯 ARCHITECTURE CIBLE (En cours d'implémentation)

---

## 📊 VISION GLOBALE

### Objectifs Architecture
1. ✅ **Scalabilité** : 100+ clients, 1000+ kiosks, 10K+ adhérents
2. ✅ **Multi-tenancy** : Isolation stricte des données par client
3. ✅ **Résilience** : Uptime 99.9%, failover automatique
4. ✅ **Performance** : Dashboard <2s, API <200ms, Voice <500ms
5. ✅ **Maintenabilité** : Code clean, documentation à jour, monitoring complet

---

## 🏛️ ARCHITECTURE SYSTÈME (Vue Macro)

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
│  (Navigateurs, Kiosks, Future Mobile App)                       │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL EDGE NETWORK                           │
│  • CDN Global (85+ edge locations)                              │
│  • Edge Middleware (Auth, Rate Limiting, CORS)                  │
│  • Static Assets Cache (Images, Fonts, JS/CSS)                  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                   NEXT.JS APPLICATION                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  FRONTEND (React Server Components + Client Components)  │  │
│  │  • Landing Page (vitrine)                                │  │
│  │  • Dashboard Multi-role (super_admin, franchise, gym)    │  │
│  │  • Kiosk Interface (voice + RFID)                        │  │
│  │  • Auth Pages (login, MFA, setup)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API ROUTES (Edge + Node.js Runtime)                     │  │
│  │  • /api/voice/* (OpenAI Realtime)                        │  │
│  │  • /api/dashboard/* (KPIs, members, sessions)            │  │
│  │  • /api/admin/* (gestion clients, monitoring)            │  │
│  │  • /api/kiosk/* (provisioning, heartbeat, RFID)          │  │
│  │  • /api/jarvis/tools/* (function calling)                │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ├──────────────────┬──────────────────┬───────────────
                 ↓                  ↓                  ↓
┌─────────────────────────┐ ┌─────────────────┐ ┌──────────────────┐
│   SUPABASE PLATFORM     │ │   OPENAI API    │ │   SERVICES       │
│                         │ │                 │ │                  │
│ • PostgreSQL 15         │ │ • Realtime API  │ │ • Resend (email) │
│ • pgvector (embeddings) │ │ • Embeddings    │ │ • Sentry (logs)  │
│ • Auth + RLS            │ │ • Whisper       │ │ • Upstash (queue)│
│ • Edge Functions        │ │ • GPT-4o        │ │ • HCaptcha       │
│ • Storage (avatars)     │ │                 │ │                  │
│ • Realtime (websockets) │ │                 │ │                  │
└─────────────────────────┘ └─────────────────┘ └──────────────────┘
```

---

## 🗄️ ARCHITECTURE BASE DE DONNÉES (Schéma Cible)

### 1. Hiérarchie Multi-Tenant

```sql
-- Niveau 1: Organisation (JARVIS SaaS)
super_admins (équipe interne)
  ↓
-- Niveau 2: Clients
franchises (réseau multi-salles)
  ↓
-- Niveau 3: Salles
gyms (unité opérationnelle)
  ↓
-- Niveau 4: Équipements
kiosks (1 à N par gym) ← NOUVELLE TABLE À CRÉER
  ↓
-- Niveau 5: Utilisateurs finaux
gym_members (adhérents)
  ↓
-- Niveau 6: Interactions
sessions, conversations, analytics
```

### 2. Tables Core (Existantes - OK)

```sql
-- IDENTITY & ACCESS
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  role user_role, -- super_admin, franchise_owner, gym_manager, gym_staff
  franchise_id UUID REFERENCES franchises(id), -- Peut être NULL
  gym_id UUID REFERENCES gyms(id), -- Peut être NULL
  mfa_enabled BOOLEAN,
  is_active BOOLEAN
)

-- ORGANIZATION
franchises (
  id UUID PRIMARY KEY,
  name TEXT,
  city TEXT,
  status TEXT, -- active, suspended, trial
  subscription_plan TEXT, -- starter, pro, enterprise
  created_at TIMESTAMPTZ
)

gyms (
  id UUID PRIMARY KEY,
  franchise_id UUID REFERENCES franchises(id), -- Peut être NULL (salle indép.)
  name TEXT,
  city TEXT,
  address TEXT,
  status TEXT, -- active, maintenance, suspended
  opening_hours JSONB,
  created_at TIMESTAMPTZ
)

-- MEMBERS
gym_members_v2 (
  id UUID PRIMARY KEY,
  gym_id UUID REFERENCES gyms(id),
  badge_id TEXT UNIQUE, -- RFID
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  membership_type TEXT,
  is_active BOOLEAN,
  member_since DATE,
  last_visit TIMESTAMPTZ
)

member_fitness_profile (
  member_id UUID PRIMARY KEY REFERENCES gym_members_v2(id),
  height_cm INTEGER,
  current_weight_kg NUMERIC,
  target_weight_kg NUMERIC,
  fitness_level TEXT, -- beginner, intermediate, advanced
  primary_goals TEXT[], -- weight_loss, muscle_gain, endurance...
  workout_frequency_per_week INTEGER
)

member_preferences (
  member_id UUID PRIMARY KEY REFERENCES gym_members_v2(id),
  communication_style TEXT, -- encouraging, direct, friendly...
  language TEXT, -- fr, en, es...
  voice_preference TEXT
)
```

### 3. Tables À CRÉER (Pipeline Données)

```sql
-- ============================================================================
-- KIOSKS (NOUVELLE TABLE - PRIORITÉ P0)
-- ============================================================================
CREATE TABLE kiosks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  
  -- Identifiants
  slug TEXT UNIQUE NOT NULL, -- URL-friendly (ex: "gym-dax-principal")
  name TEXT NOT NULL, -- Nom affichage (ex: "Kiosk Entrée")
  provisioning_code TEXT UNIQUE NOT NULL, -- Code 6 chars pour setup
  
  -- Status & Monitoring
  status TEXT NOT NULL DEFAULT 'provisioning' 
    CHECK (status IN ('online', 'offline', 'error', 'provisioning', 'maintenance')),
  last_heartbeat TIMESTAMPTZ,
  last_seen_ip TEXT,
  
  -- Hardware
  device_id TEXT UNIQUE, -- MAC address ou serial
  hardware_info JSONB DEFAULT '{}'::jsonb, -- CPU, RAM, storage, etc.
  software_version TEXT, -- Version app kiosk
  
  -- Configuration JARVIS
  voice_model TEXT DEFAULT 'alloy',
  language TEXT DEFAULT 'fr',
  openai_model TEXT DEFAULT 'gpt-4o-mini-realtime-preview-2024-12-17',
  
  -- Métadonnées
  location_in_gym TEXT, -- "Entrée principale", "Zone cardio"
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_kiosks_gym ON kiosks(gym_id);
CREATE INDEX idx_kiosks_status ON kiosks(status);
CREATE INDEX idx_kiosks_slug ON kiosks(slug);

-- RLS Policies
ALTER TABLE kiosks ENABLE ROW LEVEL SECURITY;

-- Super admin : tout voir
CREATE POLICY "super_admin_kiosks_all" ON kiosks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Gym manager : ses kiosks uniquement
CREATE POLICY "gym_manager_kiosks" ON kiosks
  FOR SELECT USING (
    gym_id IN (SELECT gym_id FROM users WHERE id = auth.uid())
  );

-- ============================================================================
-- CONVERSATION_SUMMARIES (EXISTE MAIS VIDE - À PEUPLER)
-- ============================================================================
ALTER TABLE conversation_summaries ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES openai_realtime_sessions(id);
ALTER TABLE conversation_summaries ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES gym_members_v2(id);
ALTER TABLE conversation_summaries ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES gyms(id);
ALTER TABLE conversation_summaries ADD COLUMN IF NOT EXISTS kiosk_id UUID REFERENCES kiosks(id);

-- Nouvelles colonnes pour analytics
ALTER TABLE conversation_summaries ADD COLUMN IF NOT EXISTS summary_text TEXT;
ALTER TABLE conversation_summaries ADD COLUMN IF NOT EXISTS key_topics TEXT[];
ALTER TABLE conversation_summaries ADD COLUMN IF NOT EXISTS sentiment_score NUMERIC(3,2); -- -1.0 à 1.0
ALTER TABLE conversation_summaries ADD COLUMN IF NOT EXISTS sentiment_label TEXT; -- negative, neutral, positive
ALTER TABLE conversation_summaries ADD COLUMN IF NOT EXISTS emotion_detected TEXT; -- joy, frustration, neutral...
ALTER TABLE conversation_summaries ADD COLUMN IF NOT EXISTS intents_detected TEXT[]; -- book_class, report_issue, ask_question...
ALTER TABLE conversation_summaries ADD COLUMN IF NOT EXISTS action_items JSONB; -- Actions à prendre
ALTER TABLE conversation_summaries ADD COLUMN IF NOT EXISTS embedding vector(1536); -- OpenAI embeddings pour RAG

CREATE INDEX IF NOT EXISTS idx_conversation_summaries_member ON conversation_summaries(member_id);
CREATE INDEX IF NOT EXISTS idx_conversation_summaries_gym ON conversation_summaries(gym_id);
CREATE INDEX IF NOT EXISTS idx_conversation_summaries_sentiment ON conversation_summaries(sentiment_label);

-- ============================================================================
-- MEMBER_ANALYTICS (EXISTE MAIS VIDE - À PEUPLER)
-- ============================================================================
ALTER TABLE member_analytics ADD COLUMN IF NOT EXISTS member_id UUID PRIMARY KEY REFERENCES gym_members_v2(id);
ALTER TABLE member_analytics ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES gyms(id);

-- Métriques engagement
ALTER TABLE member_analytics ADD COLUMN IF NOT EXISTS total_conversations INTEGER DEFAULT 0;
ALTER TABLE member_analytics ADD COLUMN IF NOT EXISTS total_session_duration_seconds INTEGER DEFAULT 0;
ALTER TABLE member_analytics ADD COLUMN IF NOT EXISTS avg_session_duration_seconds NUMERIC(10,2);
ALTER TABLE member_analytics ADD COLUMN IF NOT EXISTS last_conversation_at TIMESTAMPTZ;
ALTER TABLE member_analytics ADD COLUMN IF NOT EXISTS conversation_frequency TEXT; -- daily, weekly, monthly, rare

-- Sentiment analysis
ALTER TABLE member_analytics ADD COLUMN IF NOT EXISTS avg_sentiment_score NUMERIC(3,2); -- -1.0 à 1.0
ALTER TABLE member_analytics ADD COLUMN IF NOT EXISTS sentiment_trend TEXT; -- improving, stable, declining
ALTER TABLE member_analytics ADD COLUMN IF NOT EXISTS negative_sentiment_count INTEGER DEFAULT 0;
ALTER TABLE member_analytics ADD COLUMN IF NOT EXISTS positive_sentiment_count INTEGER DEFAULT 0;

-- Churn prediction
ALTER TABLE member_analytics ADD COLUMN IF NOT EXISTS churn_risk_score NUMERIC(3,2); -- 0.0 à 1.0
ALTER TABLE member_analytics ADD COLUMN IF NOT EXISTS churn_risk_level TEXT; -- low, medium, high, critical
ALTER TABLE member_analytics ADD COLUMN IF NOT EXISTS churn_factors JSONB; -- Raisons du risque
ALTER TABLE member_analytics ADD COLUMN IF NOT EXISTS last_churn_analysis_at TIMESTAMPTZ;

-- Engagement metrics
ALTER TABLE member_analytics ADD COLUMN IF NOT EXISTS engagement_score NUMERIC(3,2); -- 0.0 à 1.0
ALTER TABLE member_analytics ADD COLUMN IF NOT EXISTS days_since_last_visit INTEGER;
ALTER TABLE member_analytics ADD COLUMN IF NOT EXISTS visit_frequency_per_week NUMERIC(4,2);

-- Timestamps
ALTER TABLE member_analytics ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_member_analytics_gym ON member_analytics(gym_id);
CREATE INDEX IF NOT EXISTS idx_member_analytics_churn ON member_analytics(churn_risk_level);
CREATE INDEX IF NOT EXISTS idx_member_analytics_engagement ON member_analytics(engagement_score);

-- ============================================================================
-- MANAGER_ALERTS (EXISTE MAIS VIDE - À PEUPLER)
-- ============================================================================
ALTER TABLE manager_alerts ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE manager_alerts ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES gyms(id);
ALTER TABLE manager_alerts ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES gym_members_v2(id); -- Peut être NULL
ALTER TABLE manager_alerts ADD COLUMN IF NOT EXISTS kiosk_id UUID REFERENCES kiosks(id); -- Peut être NULL

-- Type & Priorité
ALTER TABLE manager_alerts ADD COLUMN IF NOT EXISTS alert_type TEXT NOT NULL; -- churn_risk, negative_feedback, equipment_issue, milestone...
ALTER TABLE manager_alerts ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium'
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Contenu
ALTER TABLE manager_alerts ADD COLUMN IF NOT EXISTS title TEXT NOT NULL;
ALTER TABLE manager_alerts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE manager_alerts ADD COLUMN IF NOT EXISTS recommended_actions JSONB; -- Actions suggérées
ALTER TABLE manager_alerts ADD COLUMN IF NOT EXISTS context JSONB; -- Données additionnelles

-- Status
ALTER TABLE manager_alerts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'
  CHECK (status IN ('pending', 'in_progress', 'resolved', 'dismissed'));
ALTER TABLE manager_alerts ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id); -- Peut être NULL
ALTER TABLE manager_alerts ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE manager_alerts ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

-- Timestamps
ALTER TABLE manager_alerts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE manager_alerts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_manager_alerts_gym ON manager_alerts(gym_id);
CREATE INDEX IF NOT EXISTS idx_manager_alerts_status ON manager_alerts(status);
CREATE INDEX IF NOT EXISTS idx_manager_alerts_priority ON manager_alerts(priority);
CREATE INDEX IF NOT EXISTS idx_manager_alerts_member ON manager_alerts(member_id);

-- ============================================================================
-- INSIGHTS_REPORTS (EXISTE MAIS VIDE - À PEUPLER)
-- ============================================================================
ALTER TABLE insights_reports ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE insights_reports ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES gyms(id);
ALTER TABLE insights_reports ADD COLUMN IF NOT EXISTS franchise_id UUID REFERENCES franchises(id); -- Pour rapports agrégés

-- Type & Période
ALTER TABLE insights_reports ADD COLUMN IF NOT EXISTS report_type TEXT NOT NULL; -- daily, weekly, monthly, quarterly
ALTER TABLE insights_reports ADD COLUMN IF NOT EXISTS period_start TIMESTAMPTZ NOT NULL;
ALTER TABLE insights_reports ADD COLUMN IF NOT EXISTS period_end TIMESTAMPTZ NOT NULL;

-- Contenu
ALTER TABLE insights_reports ADD COLUMN IF NOT EXISTS title TEXT NOT NULL;
ALTER TABLE insights_reports ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE insights_reports ADD COLUMN IF NOT EXISTS insights JSONB; -- Insights détectés
ALTER TABLE insights_reports ADD COLUMN IF NOT EXISTS metrics JSONB; -- KPIs calculés
ALTER TABLE insights_reports ADD COLUMN IF NOT EXISTS recommendations JSONB; -- Actions recommandées
ALTER TABLE insights_reports ADD COLUMN IF NOT EXISTS trends JSONB; -- Évolutions vs période précédente

-- Statut
ALTER TABLE insights_reports ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft'
  CHECK (status IN ('draft', 'published', 'archived'));

-- Timestamps
ALTER TABLE insights_reports ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE insights_reports ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_insights_reports_gym ON insights_reports(gym_id);
CREATE INDEX IF NOT EXISTS idx_insights_reports_type ON insights_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_insights_reports_period ON insights_reports(period_start, period_end);
```

---

## ⚙️ ARCHITECTURE TRAITEMENT DONNÉES (Pipeline)

### Flux de Traitement Session

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. SESSION OPENAI REALTIME (Kiosk)                                  │
│    • Member badge scan → Récupération profil                        │
│    • Conversation vocale speech-to-speech                           │
│    • Function calling (tools JARVIS)                                │
│    • Tracking tokens/coûts                                          │
└────────────────────┬────────────────────────────────────────────────┘
                     │ Session terminée (state = 'closed')
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 2. TRIGGER DATABASE: on_session_end()                               │
│    → Créer entry dans conversation_summaries (status = 'pending')   │
│    → Enqueue job async: process_conversation                        │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 3. EDGE FUNCTION: process_conversation(session_id)                  │
│    A. Récupérer transcription complète                              │
│    B. Générer summary (GPT-4o-mini)                                 │
│    C. Extraire topics (prompt engineering)                          │
│    D. Analyser sentiment (GPT-4o-mini)                              │
│    E. Détecter émotions                                             │
│    F. Identifier intents                                            │
│    G. Créer embedding (OpenAI text-embedding-3-small)               │
│    H. Mettre à jour conversation_summaries                          │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 4. EDGE FUNCTION: update_member_analytics(member_id)                │
│    → Recalculer métriques agrégées:                                 │
│      • Total conversations                                          │
│      • Avg sentiment                                                │
│      • Engagement score                                             │
│      • Churn risk score (règles + ML futur)                         │
│    → Mettre à jour member_analytics                                 │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 5. EDGE FUNCTION: generate_alerts_if_needed(member_id, gym_id)      │
│    → IF churn_risk > 0.7 → Créer alerte "Risque churn critique"    │
│    → IF sentiment < -0.5 → Créer alerte "Feedback négatif"         │
│    → IF milestone atteint → Créer alerte "Félicitations membre"    │
│    → Insérer dans manager_alerts                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Jobs Cron (Supabase ou Upstash)

```typescript
// Job 1: Calcul churn quotidien (02:00 UTC)
CRON: 0 2 * * *
FUNCTION: calculate_daily_churn_risk()
DESCRIPTION:
  - Récupérer tous members actifs
  - Calculer churn risk score via règles:
    * days_since_last_visit > 14 → +0.3
    * negative_sentiment_count > 3 → +0.2
    * engagement_score < 0.3 → +0.2
    * membership_expires < 30 days → +0.2
  - Mettre à jour member_analytics
  - Générer alertes si churn_risk > 0.7

// Job 2: Génération rapports hebdomadaires (Lundi 06:00 UTC)
CRON: 0 6 * * 1
FUNCTION: generate_weekly_reports()
DESCRIPTION:
  - Pour chaque gym actif:
    * Agréger métriques semaine passée
    * Identifier tendances
    * Générer recommandations IA
    * Créer entry insights_reports
  - Envoyer email notification gérants (optionnel)

// Job 3: Nettoyage données anciennes (Dimanche 03:00 UTC)
CRON: 0 3 * * 0
FUNCTION: cleanup_old_data()
DESCRIPTION:
  - Archiver sessions > 6 mois
  - Supprimer heartbeats > 30 jours
  - Archiver rapports > 1 an

// Job 4: Health check kiosks (Toutes les 5 minutes)
CRON: */5 * * * *
FUNCTION: check_kiosks_health()
DESCRIPTION:
  - Vérifier last_heartbeat de tous kiosks
  - Si last_heartbeat > 10 min → status = 'offline'
  - Générer alerte manager si offline > 30 min
```

---

## 🎨 ARCHITECTURE FRONTEND

### 1. Structure Pages

```
app/
├── page.tsx                          → Redirect vers /landing-client
├── landing-client/page.tsx           → Page vitrine publique
├── login/page.tsx                    → Auth (email + password)
├── auth/
│   ├── mfa/page.tsx                  → Challenge MFA (TOTP)
│   └── setup/page.tsx                → Setup compte initial
│
├── dashboard/                        → Dashboard multi-role
│   ├── layout.tsx                    → GymContext + DashboardShell
│   ├── page.tsx                      → Vue d'ensemble (KPIs)
│   │
│   ├── members/page.tsx              → Liste adhérents + churn risk
│   ├── sessions/page.tsx             → Historique conversations JARVIS
│   ├── analytics/page.tsx            → Graphiques métriques
│   ├── insights/page.tsx             → Recommandations IA
│   ├── alerts/page.tsx               → Alertes actives
│   │
│   ├── kiosks/                       → Gestion kiosks
│   │   ├── page.tsx                  → Liste kiosks gym
│   │   └── [id]/page.tsx             → Détails + config kiosk
│   │
│   ├── admin/                        → Super admin uniquement
│   │   ├── clients/page.tsx          → Liste franchises + salles
│   │   ├── franchises/
│   │   │   ├── page.tsx              → Liste franchises
│   │   │   └── [id]/page.tsx         → Détails franchise
│   │   ├── gyms/
│   │   │   ├── page.tsx              → Liste gyms
│   │   │   └── [id]/page.tsx         → Détails gym
│   │   ├── users/page.tsx            → Gestion comptes
│   │   ├── monitoring/page.tsx       → Infra (kiosks, API, errors)
│   │   ├── costs/page.tsx            → Coûts OpenAI + infra
│   │   └── logs/page.tsx             → Audit trail
│   │
│   ├── franchise/page.tsx            → Vue agrégée franchise
│   ├── settings/page.tsx             → Profil utilisateur
│   └── team/page.tsx                 → Gestion équipe gym
│
└── kiosk/[slug]/page.tsx             → Interface kiosk (voice + RFID)
```

### 2. Composants Architecture

```
components/
├── dashboard/
│   ├── DashboardShell.tsx            → Layout + sidebar + nav
│   ├── ContextSwitcher.tsx           → Dropdown switch gym/franchise
│   ├── KPICard.tsx                   → Carte métrique réutilisable
│   ├── ChartContainer.tsx            → Wrapper charts avec loading
│   └── AlertsList.tsx                → Liste alertes avec actions
│
├── kiosk/
│   ├── VoiceInterface.tsx            → Interface OpenAI Realtime
│   ├── JarvisAvatar.tsx              → Avatar 3D animé
│   ├── RFIDSimulator.tsx             → Scan badge (dev + prod)
│   ├── ProvisioningInterface.tsx     → Setup initial kiosk
│   └── MicrophoneDiagnostic.tsx      → Tests audio
│
├── admin/
│   ├── ClientsTable.tsx              → Table clients avec filters
│   ├── UsersTable.tsx                → Gestion comptes
│   ├── KiosksMonitoring.tsx          → Grid status kiosks
│   └── CostsChart.tsx                → Graph coûts OpenAI
│
├── common/
│   ├── JarvisLogo.tsx                → Logo avec mini-sphère 3D
│   ├── LoadingSpinner.tsx            → Spinner réutilisable
│   ├── ErrorBoundary.tsx             → Error handling UI
│   └── ModernFluidShapes.tsx         → Background animations
│
└── ui/                               → Shadcn/ui components
    ├── button.tsx
    ├── card.tsx
    ├── table.tsx
    └── ... (27 composants)
```

---

## 🔐 ARCHITECTURE SÉCURITÉ

### 1. Auth Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Login (/login)                                                │
│    → Email + Password (Supabase Auth)                           │
│    → Si MFA activé → Redirect /auth/mfa                         │
│    → Sinon → Redirect /dashboard                                │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. MFA Challenge (/auth/mfa)                                    │
│    → TOTP 6 digits                                              │
│    → Vérification Supabase                                      │
│    → Si OK → Create session → Redirect /dashboard              │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Middleware Check (toutes requêtes /dashboard, /admin)        │
│    → Vérifier session Supabase                                  │
│    → Récupérer user profile (role, gym_id, franchise_id)       │
│    → Vérifier permissions route (canAccessRoute)                │
│    → Si KO → Redirect /login                                    │
│    → Si OK → Ajouter headers user pour API routes              │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. RLS Database (Row Level Security)                            │
│    → Policies Supabase sur CHAQUE table                         │
│    → Filtre automatique selon auth.uid() et role                │
│    → Isolation stricte données multi-tenant                     │
└─────────────────────────────────────────────────────────────────┘
```

### 2. RLS Policies Pattern

```sql
-- Pattern pour TOUTES les tables sensibles:

-- Policy 1: Super admin voit tout
CREATE POLICY "super_admin_all" ON [TABLE]
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Policy 2: Franchise owner voit ses salles
CREATE POLICY "franchise_owner_gyms" ON [TABLE]
  FOR SELECT USING (
    gym_id IN (
      SELECT id FROM gyms 
      WHERE franchise_id = (
        SELECT franchise_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Policy 3: Gym manager voit sa salle uniquement
CREATE POLICY "gym_manager_own_gym" ON [TABLE]
  FOR SELECT USING (
    gym_id IN (
      SELECT gym_id FROM users WHERE id = auth.uid()
    )
  );
```

### 3. Rate Limiting

```typescript
// Middleware rate limiting (Simple In-Memory)
// Production: Utiliser Upstash Redis

const RATE_LIMITS = {
  api: {
    requests: 100,
    window: 60 * 1000, // 1 minute
  },
  voice: {
    requests: 30,
    window: 60 * 1000,
  },
  admin: {
    requests: 200,
    window: 60 * 1000,
  },
}

// Appliqué dans middleware.ts
// Headers retournés: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
```

---

## 📈 ARCHITECTURE MONITORING

### 1. Métriques Collectées

```typescript
// A. Métriques Application (Sentry)
interface AppMetrics {
  errors: {
    count: number
    by_route: Record<string, number>
    by_severity: Record<string, number>
  }
  performance: {
    api_latency_p50: number
    api_latency_p95: number
    page_load_time: number
  }
  users: {
    active_sessions: number
    requests_per_minute: number
  }
}

// B. Métriques Infrastructure (Vercel)
interface InfraMetrics {
  deployments: {
    build_time: number
    status: 'success' | 'failed'
  }
  functions: {
    invocations: number
    duration_avg: number
    errors: number
  }
  bandwidth: {
    requests: number
    data_transfer_gb: number
  }
}

// C. Métriques Business (Custom)
interface BusinessMetrics {
  kiosks: {
    online_count: number
    offline_count: number
    avg_uptime_percent: number
  }
  sessions: {
    total_today: number
    avg_duration_seconds: number
    cost_total_usd: number
  }
  members: {
    total_active: number
    churn_risk_critical_count: number
    avg_engagement_score: number
  }
  alerts: {
    pending_count: number
    resolved_today_count: number
  }
}
```

### 2. Dashboards Monitoring

```
/dashboard/admin/monitoring/
├── Overview (Health global)
│   ├── System Status (API, DB, OpenAI)
│   ├── Kiosks Online/Offline Map
│   └── Critical Alerts Count
│
├── Performance
│   ├── API Latency (P50, P95, P99)
│   ├── Database Queries Slow (>500ms)
│   └── OpenAI Realtime Latency
│
├── Costs
│   ├── OpenAI Usage (tokens, $)
│   ├── Vercel Bandwidth
│   ├── Supabase Usage
│   └── Total Cost per Customer
│
└── Errors
    ├── Error Rate (last 24h)
    ├── Errors by Route
    └── Sentry Issues Link
```

---

## 🚀 ARCHITECTURE DÉPLOIEMENT

### 1. Environnements

```yaml
Development:
  URL: http://localhost:3001
  Database: Supabase Dev Project
  OpenAI: Test API Key (limite bas)
  Features: Tous activés, logs verbose
  
Staging: (Future)
  URL: https://staging.jarvis-group.net
  Database: Supabase Staging Project
  OpenAI: Production API Key (limite test)
  Features: Identique production
  
Production:
  URL: https://jarvis-group.net
  Database: Supabase Production Project
  OpenAI: Production API Key
  Features: Feature flags contrôlés
  Monitoring: Sentry activé
```

### 2. CI/CD Pipeline (Vercel)

```yaml
# .github/workflows/deploy.yml (Future si besoin)

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    - npm run lint
    - npx tsc --noEmit
  
  test:
    - npm run test:unit
    - npm run test:e2e
  
  build:
    - npm run build
    - Vérifier bundle size < 500KB
  
  deploy:
    - Si main → Vercel Production
    - Si PR → Vercel Preview
```

### 3. Rollback Strategy

```bash
# Vercel permet rollback instant vers déploiement précédent
# Via Dashboard Vercel: Deployments → Select previous → Promote to Production

# Database migrations: Toujours réversibles
# Fichier: supabase/migrations/YYYYMMDD_feature.sql
# Rollback manuel si nécessaire via Supabase Dashboard
```

---

## 🎯 MÉTRIQUES SUCCÈS ARCHITECTURE

### Objectifs Techniques
- ✅ Uptime > 99.9% (monitoring Vercel)
- ✅ API P95 latency < 200ms
- ✅ OpenAI Realtime latency < 500ms
- ✅ Dashboard load time < 2s (Lighthouse)
- ✅ Build time < 10 min (Vercel)
- ✅ Zero security vulnerabilities (Snyk)

### Objectifs Business
- ✅ Support 100+ clients simultanés
- ✅ 1000+ kiosks online
- ✅ 10K+ adhérents actifs
- ✅ Cost per session < $2 USD
- ✅ Churn detection accuracy > 70%

---

## 🔄 ÉVOLUTION ARCHITECTURE (Roadmap)

### Phase 1 (Actuelle) : Fondations
- ✅ Architecture multi-tenant fonctionnelle
- ⚠️ Pipeline données à compléter
- ⚠️ Jobs automatiques à implémenter
- ⚠️ Dashboard admin à finaliser

### Phase 2 (Q1 2026) : Optimisation
- Microservices pour traitement ML (séparé de Next.js)
- Queue system (Upstash QStash) pour jobs lourds
- Caching Redis (Upstash) pour métriques fréquentes
- CDN assets (Vercel Edge)

### Phase 3 (Q2 2026) : Scale
- Multi-région (Supabase read replicas)
- Kubernetes pour workers ML
- Data warehouse (Snowflake/BigQuery) pour analytics avancés
- Mobile App (React Native) pour adhérents

---

**ARCHITECTURE VIVANTE : Ce document évolue avec le projet. Mise à jour à chaque décision architecturale majeure.**

