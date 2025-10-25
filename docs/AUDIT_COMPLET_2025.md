# 🔍 AUDIT COMPLET JARVIS SaaS - Octobre 2025

**Date :** 25 octobre 2025  
**Objectif :** Audit total avant refonte dashboard professionnel

---

## 📊 1. MODÈLE BUSINESS CLARIFIÉ

### Offre commerciale
- **Solution SaaS B2B** : Interface vocale IA (JARVIS) pour salles de sport
- **Prix :** ~1200€/mois par salle
- **Vente :** Contrat direct avec clients

### Types de clients
1. **Franchises** (réseau multi-salles)
   - Exemple : "FitGroup" avec 5 salles
   - 1 compte franchise owner
   - N salles sous la franchise
   
2. **Salles indépendantes** (mono-salle)
   - Exemple : "Gym Center Marseille"
   - 1 compte gym manager
   - 1 salle

### Rôles utilisateurs

#### 1. `super_admin` (Toi + ton équipe)
**Responsabilités :**
- Gestion globale du SaaS
- Maintenance technique
- SAV clients
- Créer/gérer comptes clients
- Monitoring infrastructure (kiosks, API, coûts)
- Accès à TOUS les dashboards clients

**Dashboard super_admin doit contenir :**
- Métriques globales SaaS (MRR, clients actifs, churn)
- Liste clients (franchises + salles indépendantes)
- Monitoring technique (kiosks online, API health, errors)
- Coûts OpenAI/infrastructure
- Gestion comptes utilisateurs
- Logs/audit trail
- SAV tickets/alerts

#### 2. `franchise_owner` (Gérant franchise)
**Responsabilités :**
- Gérer ses salles
- Voir données agrégées de sa franchise
- Accéder au dashboard de chaque salle

**Dashboard franchise doit contenir :**
- Vue agrégée : metrics toutes salles confondues
- Liste ses salles (drill-down)
- Comparaison performances entre salles
- Gestion team franchise (optionnel)

#### 3. `gym_manager` (Gérant salle)
**Responsabilités :**
- Gérer SA salle uniquement
- Voir insights/rapports/recommandations JARVIS
- Gérer ses adhérents
- Configurer kiosk

**Dashboard gym doit contenir :**
- KPIs salle (membres actifs, sessions JARVIS, churn risk)
- Liste adhérents + profils
- Insights/recommandations IA
- Rapports périodiques
- Config kiosk
- Sessions JARVIS (historique)

---

## 🗄️ 2. AUDIT BASE DE DONNÉES

### Tables principales (20 tables core)

#### **Clients & Organisation**
```sql
franchises (2 rows)
├── id, name, city, country
├── status (active/trial/suspended)
├── subscription_plan (starter/professional/enterprise)
└── jarvis_config (jsonb)

gyms (4 rows)
├── id, franchise_id, name, city, address
├── status (active/maintenance/suspended)
├── kiosk_config (jsonb) ⚠️ Config kiosk ici, pas table dédiée
└── opening_hours (jsonb)
```

**❌ MANQUE :** Table `kiosks` dédiée pour gestion professionnelle

#### **Utilisateurs**
```sql
users (8 rows)
├── id, email, full_name
├── role (super_admin, franchise_owner, gym_manager, gym_staff)
├── franchise_id (nullable)
├── gym_id (nullable) ⚠️ Ajouté récemment
├── franchise_access (array uuid) ⚠️ Redondant avec franchise_id ?
├── gym_access (array uuid) ⚠️ Redondant avec gym_id ?
└── mfa_required, mfa_enrolled
```

**⚠️ INCOHÉRENCES :**
- `franchise_access` ET `franchise_id` → Redondant
- `gym_access` ET `gym_id` → Redondant
- À nettoyer : garder `franchise_id`/`gym_id` uniquement

#### **Adhérents & Profils**
```sql
gym_members_v2 (12 rows) ✅ Table refaite récemment
├── id, gym_id, badge_id (RFID unique)
├── first_name, last_name, email, phone
├── membership_type, is_active
└── can_use_jarvis

member_fitness_profile (12 rows)
├── member_id (FK gym_members_v2)
├── height_cm, current_weight_kg, target_weight_kg
├── fitness_level, primary_goals
└── workout_frequency_per_week

member_preferences (12 rows)
├── member_id (FK gym_members_v2)
├── communication_style (encouraging, direct, friendly...)
├── feedback_style (motivating, technical...)
└── language (fr, en, es...)

member_facts (0 rows) ⚠️ Vide
├── member_id, category (goal/injury/preference)
├── fact_key, fact_value (jsonb)
└── confidence (0-1), source_session_id

member_analytics (0 rows) ⚠️ Vide
├── member_id
├── total_conversations, avg_session_duration
├── churn_risk_score, churn_risk_level
└── sentiment_trend
```

**⚠️ TABLES VIDES :**
- `member_facts` : Censé stocker infos extraites des conversations
- `member_analytics` : Censé calculer churn risk, engagement
- **Ces tables doivent être peuplées par jobs automatiques**

#### **Conversations & IA**
```sql
openai_realtime_sessions (1 row)
├── session_id, gym_id, kiosk_slug
├── member_badge_id, member_name
├── input_tokens, output_tokens, total_cost_usd
├── session_duration_seconds
└── state (active/closed), end_reason

conversation_summaries (0 rows) ⚠️ Vide
├── session_id, member_id, gym_id
├── summary_text, key_topics, sentiment
└── embedding (vector 1536D pour RAG)

conversation_events (0 rows) ⚠️ Vide
├── session_id, event_type (user_speech, ai_speech, tool_call...)
├── transcript, tool_name, tool_args
└── timestamp

member_embeddings (5 rows)
├── member_id, embedding (vector 384D)
├── context (profile/preferences/goals)
└── input_text
```

**❌ PROBLÈME MAJEUR :**
- Les conversations ne sont PAS enregistrées
- `conversation_summaries` et `conversation_events` sont vides
- **Sans ces données, impossible de générer insights/recommandations**
- **Il manque le pipeline de traitement des sessions**

#### **Kiosks & Monitoring**
```sql
kiosk_heartbeats (1 row)
├── gym_id (PK), kiosk_slug
├── last_heartbeat, status (online/offline)
└── updated_at

kiosk_metrics (4 rows)
├── gym_id, kiosk_slug
├── cpu_usage, memory_usage, storage_usage
├── microphone_level, speaker_volume, audio_quality
└── browser_info, hardware_info (jsonb)
```

**❌ ARCHITECTURE CASSÉE :**
- `kiosk_heartbeats` utilise `gym_id` comme PK → 1 seul kiosk par gym max
- Pas de table `kiosks` dédiée avec `id`, `provisioning_code`, etc.
- Config kiosk dans `gyms.kiosk_config` (JSONB) → Pas professionnel
- **Impossible de gérer plusieurs kiosks par salle**

#### **Alertes & Rapports**
```sql
manager_alerts (0 rows) ⚠️ Vide
├── gym_id, member_id, alert_type
├── priority (low/medium/high/urgent)
├── title, description, recommended_actions (jsonb)
└── status (pending/in_progress/resolved)

insights_reports (0 rows) ⚠️ Vide
├── gym_id, report_type (daily/weekly/monthly)
├── title, summary, insights (jsonb)
├── metrics (jsonb), recommendations (jsonb)
└── generated_at, period_start, period_end
```

**❌ FONCTIONNALITÉS INEXISTANTES :**
- Alertes intelligentes (churn risk, equipment issues) → Jamais générées
- Rapports automatiques (daily/weekly) → Jamais générés
- **Il manque les jobs cron/background pour générer tout ça**

#### **Coûts & Analytics**
```sql
openai_realtime_cost_tracking (27 rows)
├── hour_start (PK - bucket horaire)
├── total_sessions, total_cost_usd
├── input_tokens, output_tokens
└── success_rate, avg_session_duration

jarvis_session_costs (0 rows) ⚠️ Vide
├── session_id, gym_id, franchise_id
├── duration_seconds, total_cost
└── user_satisfaction (1-5)
```

**⚠️ INCOHÉRENCE :**
- `openai_realtime_cost_tracking` contient des données (agrégées par heure)
- `jarvis_session_costs` est vide → Devrait contenir coût par session
- **Redondance entre les 2 tables**

---

## 🏗️ 3. AUDIT ARCHITECTURE CODE

### Structure actuelle

```
src/app/
├── dashboard/
│   ├── layout.tsx (avec GymContextProvider + DashboardShell) ✅
│   ├── page.tsx (overview KPIs) ✅
│   ├── members-v2/page.tsx ✅
│   ├── sessions-v2/page.tsx ✅
│   ├── analytics-v2/page.tsx ✅
│   ├── kiosk/page.tsx ❌ Cherche table inexistante
│   └── admin/
│       └── franchises/page.tsx ❌ Pas testé avec vraie data
├── kiosk/[slug]/page.tsx ✅ Interface kiosk fonctionnelle
├── login/page.tsx ✅
└── api/
    ├── dashboard/
    │   ├── overview/ ✅ (stats, alerts)
    │   ├── members-v2/ ✅
    │   ├── sessions-v2/ ✅
    │   ├── analytics-v2/ ✅
    │   ├── kiosk/ ❌ Cherche table inexistante
    │   └── admin/franchises/ ❌
    ├── voice/ ✅ Sessions OpenAI Realtime
    ├── jarvis/tools/ ✅ Function calling
    └── manager/ ⚠️ Anciennes routes à vérifier
```

### Pages manquantes (404)
```
❌ /dashboard/admin/users (gestion comptes clients)
❌ /dashboard/admin/monitoring (infra, kiosks, errors)
❌ /dashboard/admin/logs (audit trail)
❌ /dashboard/team (gestion équipe gym)
❌ /dashboard/settings (profil, préférences)
❌ /dashboard/kiosk/[id]/settings (config kiosk individuel)
```

### Composants
```
✅ DashboardShell (sidebar, nav)
✅ GymContext Provider (filtrage role)
✅ ContextSwitcher (dropdown gym)
❌ Logo JARVIS (juste lettre "J", manque mini-sphère 3D)
❌ Composants dashboard réutilisables (MetricCard, etc.) → Archivés
```

---

## 🚨 4. PROBLÈMES CRITIQUES IDENTIFIÉS

### P0 - BLOQUANTS
1. ❌ **Table `kiosks` inexistante** → Page dashboard kiosk cassée
2. ❌ **Conversations non enregistrées** → Impossible générer insights
3. ❌ **Pipeline traitement sessions manquant** → Pas de `conversation_summaries`
4. ❌ **Jobs cron/background manquants** → Pas d'alertes ni rapports automatiques

### P1 - MAJEURS
5. ⚠️ **Architecture kiosk cassée** (1 kiosk max par gym)
6. ⚠️ **Redondances BDD** (`franchise_access` vs `franchise_id`)
7. ⚠️ **Tables analytics vides** (`member_analytics`, `member_facts`)
8. ⚠️ **Design pas premium** (logo simple, manque identité)

### P2 - MINEURS
9. ⚠️ **Pages admin manquantes** (users, monitoring, logs)
10. ⚠️ **Gestion clients inexistante**
11. ⚠️ **Documentation incomplète**

---

## 📋 5. CE QUI FONCTIONNE

### ✅ Solidités
1. **Auth & RLS** bien configurés
2. **Middleware** sécurisé (rate limiting, permissions)
3. **Interface kiosk** fonctionnelle (`/kiosk/[slug]`)
4. **API voice** OpenAI Realtime opérationnelle
5. **Schema BDD** bien structuré (normalisé v2)
6. **Build** stable (6-8 min, pas d'erreurs critiques)
7. **Dashboard gym_manager** fonctionnel (membres, sessions, analytics)

---

## 🎯 6. RECOMMANDATIONS ARCHITECTURE

### Option recommandée : **HYBRIDE PROFESSIONNEL**

#### Vue Super Admin (Drill-down)
```
/dashboard (super_admin)
├── Vue globale SaaS
│   ├── MRR, ARR, Churn
│   ├── Clients actifs (X franchises, Y salles)
│   ├── Coûts infra (OpenAI, hosting)
│   └── Health global (kiosks, API)
│
├── /admin/clients (liste franchises + salles indépendantes)
│   ├── Clic sur franchise → /admin/franchises/[id]
│   │   ├── Données agrégées franchise
│   │   ├── Liste salles de la franchise
│   │   └── Clic sur salle → Dashboard gym
│   │
│   └── Clic sur salle indépendante → Dashboard gym
│
├── /admin/monitoring (technique)
│   ├── Kiosks online/offline
│   ├── API health, latency
│   ├── Errors logs
│   └── Cost tracking OpenAI
│
├── /admin/users (gestion comptes)
│   ├── Créer franchise owner
│   ├── Créer gym manager
│   └── Gérer team interne
│
└── /admin/support (SAV)
    ├── Tickets clients
    └── Alerts critiques
```

#### Vue Franchise Owner (Agrégation + Drill-down)
```
/dashboard (franchise_owner)
├── Vue agrégée franchise
│   ├── Metrics toutes salles
│   ├── Comparaison salles
│   └── Top/Flop performers
│
└── Liste salles
    └── Clic → Dashboard gym de la salle
```

#### Vue Gym Manager (Single gym)
```
/dashboard (gym_manager)
├── KPIs salle
├── Insights/Recommandations IA
├── Membres (churn risk, engagement)
├── Sessions JARVIS
├── Analytics
└── Config kiosk
```

---

## 💡 7. TEMPLATES DASHBOARD RECOMMANDÉS

### Option A : **Tremor** (React components)
- ✅ Gratuit, open-source
- ✅ Composants analytics prêts
- ✅ Charts, tables, KPI cards
- ❌ Pas de drill-down navigation natif
- **Verdict :** Bon pour pages individuelles, pas architecture globale

### Option B : **Shadcn/ui Dashboard** (En cours)
- ✅ Composants modernes, customisables
- ✅ Dark mode natif
- ✅ Flexibilité totale
- ❌ Nécessite construction navigation manuelle
- **Verdict :** Bon pour custom, mais plus de travail

### Option C : **TailAdmin Pro** (Template payant ~$49)
- ✅ Dashboard complet multi-rôles
- ✅ Navigation drill-down
- ✅ Gestion users, clients
- ✅ Monitoring, analytics
- ❌ Payant
- **Verdict :** OPTIMAL pour ton cas, gain de temps énorme

### Option D : **Refine.dev** (Framework)
- ✅ Framework React admin complet
- ✅ Multi-tenancy natif (parfait pour ton cas)
- ✅ CRUD auto-généré
- ✅ Auth, RLS, drill-down
- ❌ Courbe apprentissage
- **Verdict :** Ultra professionnel, mais overkill ?

---

## 🏆 MA RECOMMANDATION FINALE

### **Plan recommandé : 3 phases**

#### **Phase 1 : Fondations (1-2 jours)**
1. Créer table `kiosks` propre
2. Implémenter pipeline traitement sessions (conversation_summaries)
3. Créer jobs cron (alertes, rapports)
4. Nettoyer redondances BDD

#### **Phase 2 : Dashboard Admin (2-3 jours)**
1. **Acheter TailAdmin Pro** ($49) → Gain 5-7 jours
2. Adapter pour ton SaaS (3 rôles)
3. Intégrer API Supabase
4. Ajouter mini-sphère JARVIS

#### **Phase 3 : Polish (1 jour)**
1. Tests E2E
2. Documentation
3. Formation utilisateurs
4. Déploiement

**Total : 4-6 jours de dev avec template**
**vs 15-20 jours from scratch**

---

## ❓ QUESTIONS POUR TOI

1. **Budget :** OK pour dépenser $49 sur TailAdmin Pro ?
2. **Timeline :** Combien de temps tu veux mettre ?
3. **Priorité :** Quoi en premier ? (Kiosks ? Pipeline sessions ? Dashboard admin ?)

**Je t'envoie la suite avec architecture détaillée dans 5 min.**

