# 🏗️ ARCHITECTURE PROFESSIONNELLE JARVIS SaaS

**Date :** 25 octobre 2025  
**Objectif :** Définir architecture dashboard niveau entreprise

---

## 🎯 1. ARCHITECTURE GLOBALE

### Hiérarchie SaaS

```
JARVIS SaaS (Toi + équipe)
│
├── Clients
│   │
│   ├── Franchises (multi-salles)
│   │   ├── Franchise A
│   │   │   ├── Salle A1
│   │   │   ├── Salle A2
│   │   │   └── Salle A3
│   │   │
│   │   └── Franchise B
│   │       ├── Salle B1
│   │       └── Salle B2
│   │
│   └── Salles indépendantes
│       ├── Salle C (indép.)
│       └── Salle D (indép.)
│
└── Team interne
    ├── Super Admin 1 (toi)
    ├── Super Admin 2
    └── Support Agent
```

---

## 👥 2. RÔLES & PERMISSIONS DÉTAILLÉS

### Super Admin (Toi + équipe)

**Accès :**
- ✅ Dashboard admin global
- ✅ Tous les dashboards clients (franchises + gyms)
- ✅ Monitoring technique
- ✅ Gestion comptes clients

**Pages :**
```
/dashboard → Vue globale SaaS
/dashboard/clients → Liste clients (franchises + salles indép.)
/dashboard/clients/franchises/[id] → Vue franchise
/dashboard/clients/gyms/[id] → Vue gym (comme gym_manager)
/dashboard/monitoring → Infra (kiosks, API, errors)
/dashboard/costs → Coûts OpenAI/infra
/dashboard/users → Gestion comptes
/dashboard/support → SAV/tickets
/dashboard/team → Gestion équipe interne
```

### Franchise Owner

**Accès :**
- ✅ Dashboard franchise (vue agrégée)
- ✅ Dashboards de ses salles uniquement
- ❌ Pas accès autres franchises
- ❌ Pas accès admin global

**Pages :**
```
/dashboard → Vue agrégée franchise
/dashboard/gyms → Liste ses salles
/dashboard/gyms/[id] → Dashboard salle (drill-down)
/dashboard/team → Gérer team franchise (optionnel)
/dashboard/settings → Config franchise
```

### Gym Manager

**Accès :**
- ✅ Dashboard de SA salle uniquement
- ❌ Pas accès autres salles
- ❌ Pas accès franchise parent

**Pages :**
```
/dashboard → Vue d'ensemble salle
/dashboard/members → Adhérents + churn risk
/dashboard/insights → Recommandations IA
/dashboard/sessions → Historique JARVIS
/dashboard/analytics → Stats détaillées
/dashboard/kiosk → Config + monitoring kiosk
/dashboard/team → Gérer staff salle (optionnel)
/dashboard/settings → Config salle
```

---

## 📊 3. MÉTRIQUES PAR RÔLE

### Super Admin - Dashboard Global

#### KPIs SaaS (Top cards)
```typescript
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Total clients actifs (X franchises, Y salles)
- Churn rate MoM
- Coût infrastructure (OpenAI + hosting)
- Marge brute
```

#### Charts
```typescript
- Évolution MRR (line chart, 12 mois)
- Nouveaux clients vs churn (bar chart)
- Coûts OpenAI vs revenus (area chart)
- Health status (donut: kiosks online/offline, API uptime)
```

#### Liste clients (Table)
```typescript
Colonnes :
- Nom client
- Type (Franchise/Salle indép.)
- Nb salles (si franchise)
- Status (actif/trial/suspendu)
- MRR
- Kiosks online/total
- Dernier contact
- Actions (Voir dashboard, Éditer, Support)
```

---

### Franchise Owner - Dashboard Franchise

#### KPIs Franchise (Top cards)
```typescript
- Total adhérents (toutes salles)
- Sessions JARVIS ce mois
- Taux satisfaction moyen
- Salles actives / total
```

#### Comparaison salles (Table)
```typescript
Colonnes :
- Nom salle
- Ville
- Adhérents actifs
- Sessions ce mois
- Churn risk
- Satisfaction
- Performance (🔥/✅/⚠️)
```

#### Top/Flop performers
```typescript
- Top 3 salles (KPIs)
- Salles en difficulté (alerts)
```

---

### Gym Manager - Dashboard Gym

#### KPIs Gym (Top cards)
```typescript
- Adhérents actifs
- Sessions JARVIS ce mois
- Taux satisfaction
- Churn risk (nb adhérents à risque)
```

#### Insights IA (Priorité #1)
```typescript
- Recommandations intelligentes
  Exemple : "12 adhérents n'ont jamais utilisé JARVIS → Envoyer invitation"
  Exemple : "Pic fréquentation prévu demain +40% → Prévoir staff"
  
- Alertes importantes
  Exemple : "⚠️ 11 adhérents à risque de churn"
  Exemple : "✅ Sophie a atteint son objectif -5kg"
  
- Suggestions actions
  Exemple : "💡 Créer challenge groupe 'Perte de poids' (8 adhérents intéressés)"
```

#### Adhérents avec churn risk
```typescript
Liste adhérents :
- Nom, photo
- Churn risk level (🔴 High, 🟡 Medium)
- Raison (pas visité 14j, sentiment négatif, etc.)
- Action suggérée
```

---

## 🗄️ 4. REFONTE BASE DE DONNÉES

### Créer table `kiosks` propre

```sql
CREATE TABLE kiosks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  
  -- Identifiants
  slug TEXT UNIQUE NOT NULL, -- URL-friendly (ex: "odeon-dax-main")
  name TEXT NOT NULL, -- Nom affichage (ex: "Kiosk Principal")
  provisioning_code TEXT UNIQUE, -- Code provisioning 6 chars
  
  -- Status
  status TEXT CHECK (status IN ('online', 'offline', 'error', 'provisioning')) DEFAULT 'provisioning',
  last_heartbeat TIMESTAMPTZ,
  last_seen_ip TEXT,
  
  -- Config hardware
  device_id TEXT, -- ID unique device (MAC, serial, etc.)
  hardware_info JSONB DEFAULT '{}', -- CPU, RAM, storage
  software_version TEXT, -- Version app kiosk
  
  -- Config JARVIS
  voice_model TEXT DEFAULT 'alloy',
  language TEXT DEFAULT 'fr',
  openai_model TEXT DEFAULT 'gpt-4o-mini-realtime-preview-2024-12-17',
  
  -- Métadonnées
  location_in_gym TEXT, -- "Entrée", "Zone cardio", etc.
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT kiosks_gym_id_slug_unique UNIQUE (gym_id, slug)
);

-- RLS
ALTER TABLE kiosks ENABLE ROW LEVEL SECURITY;

-- Super admin : tout voir
CREATE POLICY "Super admins can view all kiosks"
ON kiosks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- Gym manager : voir ses kiosks
CREATE POLICY "Gym managers can view their kiosks"
ON kiosks FOR SELECT
TO authenticated
USING (
  gym_id IN (
    SELECT gym_id FROM users WHERE id = auth.uid()
  )
);

-- Franchise owner : voir kiosks de ses salles
CREATE POLICY "Franchise owners can view their gyms kiosks"
ON kiosks FOR SELECT
TO authenticated
USING (
  gym_id IN (
    SELECT id FROM gyms
    WHERE franchise_id IN (
      SELECT franchise_id FROM users WHERE id = auth.uid()
    )
  )
);
```

### Migrer données existantes

```sql
-- Extraire kiosks depuis gyms.kiosk_config
INSERT INTO kiosks (gym_id, slug, name, provisioning_code, status)
SELECT 
  id as gym_id,
  COALESCE(
    kiosk_config->>'kiosk_url_slug',
    LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
  ) as slug,
  name || ' - Kiosk Principal' as name,
  kiosk_config->>'provisioning_code' as provisioning_code,
  CASE 
    WHEN EXISTS (SELECT 1 FROM kiosk_heartbeats WHERE kiosk_heartbeats.gym_id = gyms.id)
    THEN 'online'
    ELSE 'offline'
  END as status
FROM gyms
WHERE kiosk_config IS NOT NULL;

-- Mettre à jour kiosk_heartbeats pour utiliser kiosk_id
-- (Nécessite refonte de kiosk_heartbeats)
```

---

### Pipeline traitement sessions

```sql
-- Fonction trigger pour auto-créer conversation_summary après session
CREATE OR REPLACE FUNCTION process_session_end()
RETURNS TRIGGER AS $$
BEGIN
  -- Quand une session se termine (state = 'closed')
  IF NEW.state = 'closed' AND OLD.state = 'active' THEN
    
    -- Créer conversation_summary (sera peuplé par job async)
    INSERT INTO conversation_summaries (
      session_id,
      member_id,
      gym_id,
      session_duration_seconds,
      turn_count,
      created_at
    ) VALUES (
      NEW.session_id,
      NEW.member_id,
      NEW.gym_id,
      NEW.session_duration_seconds,
      NEW.total_user_turns + NEW.total_ai_turns,
      NOW()
    );
    
    -- Trigger job background pour :
    -- - Générer summary_text (LLM)
    -- - Extraire key_topics
    -- - Analyser sentiment
    -- - Créer embedding
    -- - Mettre à jour member_analytics
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_session_end
AFTER UPDATE ON openai_realtime_sessions
FOR EACH ROW
EXECUTE FUNCTION process_session_end();
```

---

### Jobs Cron (Supabase pg_cron ou Upstash QStash)

```sql
-- Job quotidien : Calculer churn risk
SELECT cron.schedule(
  'calculate-churn-risk',
  '0 2 * * *', -- 2h du matin
  $$
    -- Mettre à jour member_analytics.churn_risk_score
    UPDATE member_analytics
    SET 
      churn_risk_score = calculate_churn_risk(member_id),
      churn_risk_level = CASE
        WHEN churn_risk_score > 0.7 THEN 'critical'
        WHEN churn_risk_score > 0.5 THEN 'high'
        WHEN churn_risk_score > 0.3 THEN 'medium'
        ELSE 'low'
      END,
      last_churn_analysis_at = NOW()
    WHERE member_id IN (
      SELECT id FROM gym_members_v2 WHERE is_active = true
    );
  $$
);

-- Job quotidien : Générer alertes churn
SELECT cron.schedule(
  'generate-churn-alerts',
  '0 3 * * *', -- 3h du matin (après churn calc)
  $$
    INSERT INTO manager_alerts (gym_id, member_id, alert_type, priority, title, description)
    SELECT 
      gm.gym_id,
      gm.id,
      'churn_risk',
      CASE 
        WHEN ma.churn_risk_level = 'critical' THEN 'urgent'
        WHEN ma.churn_risk_level = 'high' THEN 'high'
        ELSE 'medium'
      END,
      'Risque de churn : ' || gm.first_name || ' ' || gm.last_name,
      'Ce membre n''a pas visité depuis ' || 
      EXTRACT(DAY FROM NOW() - gm.last_visit) || ' jours'
    FROM member_analytics ma
    JOIN gym_members_v2 gm ON ma.member_id = gm.id
    WHERE ma.churn_risk_level IN ('high', 'critical')
    AND NOT EXISTS (
      SELECT 1 FROM manager_alerts
      WHERE member_id = gm.id
      AND alert_type = 'churn_risk'
      AND status IN ('pending', 'in_progress')
    );
  $$
);

-- Job hebdomadaire : Générer rapport insights
SELECT cron.schedule(
  'generate-weekly-reports',
  '0 8 * * 1', -- Lundi 8h
  $$
    INSERT INTO insights_reports (gym_id, report_type, title, period_start, period_end)
    SELECT 
      id,
      'weekly_digest',
      'Rapport hebdomadaire - ' || name,
      NOW() - INTERVAL '7 days',
      NOW()
    FROM gyms
    WHERE status = 'active';
    
    -- Le contenu (insights, metrics, recommendations) sera généré
    -- par un job background qui appelle l'API insights
  $$
);
```

---

## 🎨 5. DESIGN SYSTÈME

### Logo JARVIS avec mini-sphère

```typescript
// Composant JarvisLogo.tsx
import { motion } from 'framer-motion'

export function JarvisLogo({ size = 40, showText = true }) {
  return (
    <div className="flex items-center gap-3">
      {/* Mini-sphère animée */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Core sphère */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 via-purple-600 to-purple-900"
          animate={{
            scale: [1, 1.05, 1],
            boxShadow: [
              '0 0 20px rgba(139, 92, 246, 0.5)',
              '0 0 40px rgba(139, 92, 246, 0.8)',
              '0 0 20px rgba(139, 92, 246, 0.5)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Anneaux orbites */}
        <motion.div
          className="absolute inset-0 border-2 border-purple-300/30 rounded-full"
          style={{ transform: 'rotate3d(1, 0, 0, 60deg)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Point lumineux central */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full shadow-lg shadow-white/50" />
        </div>
      </div>
      
      {/* Texte JARVIS */}
      {showText && (
        <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
          JARVIS
        </span>
      )}
    </div>
  )
}
```

### Couleurs harmonisées

```css
/* globals.css - Déjà en place, juste valider */
:root {
  --primary: 262 83% 58%; /* #8B5CF6 JARVIS purple */
  --accent: 262 83% 65%;  /* #A78BFA lighter purple */
}
```

---

## 📱 6. NAVIGATION DÉTAILLÉE

### Super Admin Navigation

```typescript
// DashboardShell.tsx - Navigation super_admin
const superAdminNav = [
  {
    section: 'Vue Globale',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    ]
  },
  {
    section: 'Clients',
    items: [
      { label: 'Tous les clients', icon: Building2, href: '/dashboard/clients' },
      { label: 'Franchises', icon: Building2, href: '/dashboard/clients/franchises' },
      { label: 'Salles indép.', icon: Dumbbell, href: '/dashboard/clients/gyms' },
    ]
  },
  {
    section: 'Technique',
    items: [
      { label: 'Monitoring', icon: Activity, href: '/dashboard/monitoring' },
      { label: 'Kiosks', icon: Monitor, href: '/dashboard/monitoring/kiosks' },
      { label: 'Coûts OpenAI', icon: DollarSign, href: '/dashboard/costs' },
      { label: 'Logs', icon: FileText, href: '/dashboard/logs' },
    ]
  },
  {
    section: 'Administration',
    items: [
      { label: 'Utilisateurs', icon: UserCog, href: '/dashboard/users' },
      { label: 'Support', icon: Headphones, href: '/dashboard/support' },
      { label: 'Équipe', icon: Users, href: '/dashboard/team' },
    ]
  },
]
```

---

## ⚡ 7. PLAN D'ACTION CONCRET

### Phase 1 : Fondations BDD (2 jours)

**Jour 1 - Matin**
- [ ] Créer migration table `kiosks`
- [ ] Migrer données existantes
- [ ] Créer trigger `process_session_end`

**Jour 1 - Après-midi**
- [ ] Setup pg_cron ou Upstash QStash
- [ ] Créer job `calculate-churn-risk`
- [ ] Créer job `generate-churn-alerts`

**Jour 2 - Matin**
- [ ] Créer job `generate-weekly-reports`
- [ ] Tester pipeline complet session → summary → analytics

**Jour 2 - Après-midi**
- [ ] Nettoyer redondances (`franchise_access`, `gym_access`)
- [ ] Documenter BDD finale

---

### Phase 2 : Dashboard Admin (3 jours)

**Option A : From Scratch (+ Shadcn/ui)**
- Jour 3-5 : Créer toutes les pages admin
- ❌ 15-20 heures de dev
- ❌ Risque bugs/incohérences

**Option B : TailAdmin Pro ($49)**
- Jour 3 : Acheter + Setup + Adaptation structure
- Jour 4 : Intégrer API Supabase
- Jour 5 : Customiser (logo JARVIS, colors)
- ✅ 8-10 heures de dev
- ✅ Dashboard cohérent out-of-the-box

**Recommandation : Option B**

---

### Phase 3 : Polish (1 jour)

**Jour 6**
- [ ] Ajouter mini-sphère JARVIS au logo
- [ ] Tests E2E (Playwright)
- [ ] Documentation utilisateur
- [ ] Déploiement production

---

## 💰 8. ESTIMATION COÛTS

### Développement
- **From scratch :** 6-8 jours (48-64h)
- **Avec TailAdmin Pro :** 4-5 jours (32-40h)
- **Économie :** 2-3 jours = 16-24h = **1200-1800€** (à 75€/h freelance)

### Licenses
- **TailAdmin Pro :** $49 one-time
- **ROI :** Immédiat (économie >> coût)

---

## ❓ DÉCISIONS À PRENDRE

1. **Template ou from scratch ?**
   - ⭐ Recommandé : TailAdmin Pro ($49)
   
2. **Priorités Phase 1 (fondations) ?**
   - ⭐ Recommandé : Table kiosks + Pipeline sessions
   
3. **Timeline ?**
   - ⭐ Optimal : 5-6 jours

**Qu'est-ce que tu en penses ?** 🎯

