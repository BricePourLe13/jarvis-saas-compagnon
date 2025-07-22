-- ===========================================
-- 🤖 JARVIS SaaS - Schéma Complet v2.0
-- Architecture Multi-Tenant: Franchise → Gym → Kiosk
-- ===========================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- 📊 TABLE: franchises
-- ===========================================
CREATE TABLE IF NOT EXISTS franchises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Information
  name VARCHAR(255) NOT NULL,
  brand_logo TEXT, -- URL vers logo
  
  -- Contact & Business
  contact_email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  headquarters_address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  
  -- JARVIS Configuration
  jarvis_config JSONB DEFAULT '{
    "avatar_customization": {},
    "brand_colors": {
      "primary": "#2563eb",
      "secondary": "#1e40af", 
      "accent": "#3b82f6"
    },
    "welcome_message": "Bienvenue dans votre salle de sport !",
    "features_enabled": ["analytics", "reports"]
  }'::jsonb,
  
  -- Admin & Status
  owner_id UUID, -- Lien vers users table
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'trial', 'suspended')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 🏋️ TABLE: gyms
-- ===========================================
CREATE TABLE IF NOT EXISTS gyms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
  
  -- Basic Information
  name VARCHAR(255) NOT NULL,
  
  -- Location
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  
  -- JARVIS Equipment & Kiosk Linking
  kiosk_config JSONB DEFAULT '{
    "provisioning_code": null,
    "kiosk_url_slug": null,
    "installation_token": null,
    "provisioning_expires_at": null,
    "is_provisioned": false,
    "provisioned_at": null,
    "last_heartbeat": null,
    "rfid_reader_id": null,
    "screen_resolution": null,
    "browser_info": {},
    "avatar_style": "friendly",
    "welcome_message": "Bonjour ! Comment puis-je vous aider ?",
    "brand_colors": {}
  }'::jsonb,
  
  -- Management
  manager_id UUID, -- Lien vers users table
  staff_ids UUID[] DEFAULT '{}', -- Array d'UUIDs vers users
  
  -- Business
  member_count INTEGER DEFAULT 0,
  opening_hours JSONB DEFAULT '[]'::jsonb, -- Array des horaires
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'offline')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 👥 TABLE: users (Mise à jour pour multi-rôles)
-- ===========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY, -- UUID Supabase auth
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  
  -- Role & Access
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'franchise_owner', 'gym_manager', 'gym_staff')),
  
  -- Scope (selon rôle)
  franchise_access UUID[], -- IDs franchises accessibles
  gym_access UUID[], -- IDs salles accessibles
  
  -- Preferences
  dashboard_preferences JSONB DEFAULT '{}'::jsonb,
  notification_settings JSONB DEFAULT '{
    "email_notifications": true,
    "push_notifications": true,
    "reports_frequency": "weekly"
  }'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 🤖 TABLE: jarvis_sessions
-- ===========================================
CREATE TABLE IF NOT EXISTS jarvis_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  
  -- Member interaction
  member_badge_id VARCHAR(255), -- ID badge RFID scanné
  conversation_transcript JSONB DEFAULT '[]'::jsonb, -- Array des messages
  
  -- AI Analysis
  intent_detected TEXT[] DEFAULT '{}', -- Array des intents détectés
  sentiment_score DECIMAL(3,2), -- -1.00 à 1.00
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  
  -- Technical
  session_duration INTEGER NOT NULL, -- En secondes
  kiosk_url_slug VARCHAR(255), -- Confirmation du kiosk
  processed_by_ai BOOLEAN DEFAULT false,
  
  -- Metadata
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_metadata JSONB DEFAULT '{}'::jsonb -- Infos techniques additionnelles
);

-- ===========================================
-- 📊 TABLE: analytics_daily (Cache des métriques)
-- ===========================================
CREATE TABLE IF NOT EXISTS analytics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Scope
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Metrics
  total_conversations INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0, -- Secondes totales
  average_satisfaction DECIMAL(3,2),
  unique_members INTEGER DEFAULT 0,
  peak_hour INTEGER, -- Heure de pointe (0-23)
  
  -- AI Insights
  top_intents TEXT[] DEFAULT '{}',
  sentiment_distribution JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte unique par jour
  UNIQUE(gym_id, date),
  UNIQUE(franchise_id, date)
);

-- ===========================================
-- 🔗 INDEXES pour Performance
-- ===========================================

-- Franchises
CREATE INDEX IF NOT EXISTS idx_franchises_owner ON franchises(owner_id);
CREATE INDEX IF NOT EXISTS idx_franchises_status ON franchises(status);

-- Gyms
CREATE INDEX IF NOT EXISTS idx_gyms_franchise ON gyms(franchise_id);
CREATE INDEX IF NOT EXISTS idx_gyms_manager ON gyms(manager_id);
CREATE INDEX IF NOT EXISTS idx_gyms_status ON gyms(status);
CREATE INDEX IF NOT EXISTS idx_gyms_kiosk_slug ON gyms((kiosk_config->>'kiosk_url_slug'));

-- Users
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_franchise_access ON users USING GIN(franchise_access);
CREATE INDEX IF NOT EXISTS idx_users_gym_access ON users USING GIN(gym_access);

-- Sessions
CREATE INDEX IF NOT EXISTS idx_sessions_gym ON jarvis_sessions(gym_id);
CREATE INDEX IF NOT EXISTS idx_sessions_timestamp ON jarvis_sessions(timestamp);
CREATE INDEX IF NOT EXISTS idx_sessions_badge ON jarvis_sessions(member_badge_id);

-- Analytics
CREATE INDEX IF NOT EXISTS idx_analytics_gym_date ON analytics_daily(gym_id, date);
CREATE INDEX IF NOT EXISTS idx_analytics_franchise_date ON analytics_daily(franchise_id, date);

-- ===========================================
-- 🔐 ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Enable RLS sur toutes les tables
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 🛡️ POLITIQUES RLS
-- ===========================================

-- FRANCHISES: Super admins voient tout, owners voient leurs franchises
CREATE POLICY "franchises_super_admin_all"
  ON franchises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "franchises_owners_own"
  ON franchises FOR ALL
  USING (
    owner_id = auth.uid()
    OR
    auth.uid() = ANY(
      SELECT unnest(franchise_access) 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- GYMS: Super admins + franchise owners + gym managers
CREATE POLICY "gyms_super_admin_all"
  ON gyms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "gyms_franchise_owners"
  ON gyms FOR ALL
  USING (
    franchise_id IN (
      SELECT id FROM franchises 
      WHERE owner_id = auth.uid()
    )
    OR
    franchise_id = ANY(
      SELECT unnest(franchise_access) 
      FROM users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "gyms_managers_own"
  ON gyms FOR ALL
  USING (
    manager_id = auth.uid()
    OR
    id = ANY(
      SELECT unnest(gym_access) 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- USERS: Super admins voient tout, autres voient selon scope
CREATE POLICY "users_super_admin_all"
  ON users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u2
      WHERE u2.id = auth.uid() 
      AND u2.role = 'super_admin'
    )
  );

CREATE POLICY "users_see_own"
  ON users FOR SELECT
  USING (id = auth.uid());

-- SESSIONS: Basé sur l'accès gym
CREATE POLICY "sessions_gym_access"
  ON jarvis_sessions FOR ALL
  USING (
    -- Super admin voit tout
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
    OR
    -- Accès basé sur la salle
    gym_id IN (
      SELECT g.id FROM gyms g
      JOIN franchises f ON g.franchise_id = f.id
      WHERE f.owner_id = auth.uid()
      OR g.manager_id = auth.uid()
      OR g.id = ANY(
        SELECT unnest(gym_access) 
        FROM users 
        WHERE id = auth.uid()
      )
    )
  );

-- ANALYTICS: Même logique que sessions
CREATE POLICY "analytics_access"
  ON analytics_daily FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
    OR
    (gym_id IS NOT NULL AND gym_id IN (
      SELECT g.id FROM gyms g
      JOIN franchises f ON g.franchise_id = f.id
      WHERE f.owner_id = auth.uid()
      OR g.manager_id = auth.uid()
      OR g.id = ANY(
        SELECT unnest(gym_access) 
        FROM users 
        WHERE id = auth.uid()
      )
    ))
    OR
    (franchise_id IS NOT NULL AND franchise_id IN (
      SELECT id FROM franchises 
      WHERE owner_id = auth.uid()
      OR id = ANY(
        SELECT unnest(franchise_access) 
        FROM users 
        WHERE id = auth.uid()
      )
    ))
  );

-- ===========================================
-- 🔧 FONCTIONS UTILITAIRES
-- ===========================================

-- Fonction pour générer code provisioning unique
CREATE OR REPLACE FUNCTION generate_provisioning_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer slug unique
CREATE OR REPLACE FUNCTION generate_gym_slug()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := 'gym-';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger à toutes les tables avec updated_at
CREATE TRIGGER update_franchises_updated_at
  BEFORE UPDATE ON franchises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gyms_updated_at
  BEFORE UPDATE ON gyms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_updated_at
  BEFORE UPDATE ON analytics_daily
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- ✅ SCHÉMA v2.0 CRÉÉ AVEC SUCCÈS !
-- ===========================================

SELECT 'JARVIS Schéma v2.0 installé avec succès !' as status;
SELECT 'Tables créées: franchises, gyms, users, jarvis_sessions, analytics_daily' as tables;
SELECT 'RLS activé avec politiques granulaires' as security;
SELECT 'Prêt pour création de franchises !' as next_step; 