-- ============================================================================
-- MIGRATION 001: CORE TABLES (Identity & Organization)
-- Date: 2025-10-23
-- Description: Tables fondamentales - users, franchises, gyms, gym_members
-- ============================================================================

-- Enable UUID extension if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. USERS (simplifié - auth + rôle)
-- ============================================================================

-- Note: La table users existe déjà, on va juste la nettoyer plus tard
-- Pour l'instant on s'assure que le type enum est correct

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_v2') THEN
    CREATE TYPE user_role_v2 AS ENUM (
      'super_admin',
      'franchise_owner',
      'manager',
      'staff',
      'member'
    );
  END IF;
END$$;

-- ============================================================================
-- 2. GYM_MEMBERS (NOUVEAU - core profile seulement)
-- ============================================================================

CREATE TABLE IF NOT EXISTS gym_members_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  
  -- Identité
  badge_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  profile_photo_url TEXT,
  
  -- Abonnement
  membership_type TEXT DEFAULT 'standard',
  member_since DATE NOT NULL DEFAULT CURRENT_DATE,
  membership_expires DATE,
  is_active BOOLEAN DEFAULT true,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL),
  CONSTRAINT valid_phone CHECK (phone ~* '^\+?[0-9\s\-()]+$' OR phone IS NULL),
  CONSTRAINT valid_membership_dates CHECK (membership_expires IS NULL OR membership_expires >= member_since)
);

-- Indexes gym_members_v2
CREATE INDEX idx_gym_members_v2_gym ON gym_members_v2(gym_id);
CREATE INDEX idx_gym_members_v2_badge ON gym_members_v2(badge_id);
CREATE INDEX idx_gym_members_v2_active ON gym_members_v2(gym_id, is_active) WHERE is_active = true;
CREATE INDEX idx_gym_members_v2_email ON gym_members_v2(email) WHERE email IS NOT NULL;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gym_members_v2_updated_at 
  BEFORE UPDATE ON gym_members_v2
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE gym_members_v2 ENABLE ROW LEVEL SECURITY;

-- Policy: Super admin voit tout
CREATE POLICY "Super admins can view all gym members" ON gym_members_v2
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Policy: Managers voient leurs gym members
CREATE POLICY "Managers can view their gym members" ON gym_members_v2
  FOR SELECT USING (
    gym_id IN (
      SELECT gym_id FROM UNNEST(
        (SELECT gym_access FROM users WHERE id = auth.uid())
      ) AS gym_id
    )
  );

-- Policy: Staff peuvent voir leurs gym members
CREATE POLICY "Staff can view their gym members" ON gym_members_v2
  FOR SELECT USING (
    gym_id IN (
      SELECT gym_id FROM UNNEST(
        (SELECT gym_access FROM users WHERE id = auth.uid())
      ) AS gym_id
    )
  );

-- ============================================================================
-- 3. MEMBER_FITNESS_PROFILE (module fitness séparé)
-- ============================================================================

CREATE TABLE IF NOT EXISTS member_fitness_profile (
  member_id UUID PRIMARY KEY REFERENCES gym_members_v2(id) ON DELETE CASCADE,
  
  -- Physical metrics
  height_cm INTEGER CHECK (height_cm > 0 AND height_cm < 300),
  current_weight_kg NUMERIC(5,2) CHECK (current_weight_kg > 0 AND current_weight_kg < 500),
  target_weight_kg NUMERIC(5,2) CHECK (target_weight_kg > 0 AND target_weight_kg < 500),
  body_fat_percentage NUMERIC(4,2) CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100),
  
  -- Fitness level & goals
  fitness_level TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  primary_goals TEXT[] DEFAULT '{}',
  target_date DATE,
  
  -- Workout preferences
  preferred_workout_times JSONB DEFAULT '{"morning": false, "afternoon": false, "evening": false}'::jsonb,
  workout_frequency_per_week INTEGER DEFAULT 3 CHECK (workout_frequency_per_week >= 0 AND workout_frequency_per_week <= 7),
  preferred_workout_duration INTEGER DEFAULT 60 CHECK (preferred_workout_duration > 0 AND preferred_workout_duration <= 300),
  preferred_workout_style TEXT CHECK (preferred_workout_style IN ('strength', 'cardio', 'mixed', 'flexibility', 'sport')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger updated_at
CREATE TRIGGER update_member_fitness_profile_updated_at 
  BEFORE UPDATE ON member_fitness_profile
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE member_fitness_profile ENABLE ROW LEVEL SECURITY;

-- Policies: Mêmes que gym_members_v2
CREATE POLICY "Managers can view fitness profiles" ON member_fitness_profile
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM gym_members_v2
      WHERE gym_id IN (
        SELECT gym_id FROM UNNEST(
          (SELECT gym_access FROM users WHERE id = auth.uid())
        ) AS gym_id
      )
    )
  );

-- ============================================================================
-- 4. MEMBER_PREFERENCES (préférences JARVIS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS member_preferences (
  member_id UUID PRIMARY KEY REFERENCES gym_members_v2(id) ON DELETE CASCADE,
  
  -- Communication style
  communication_style TEXT DEFAULT 'friendly' CHECK (communication_style IN (
    'encouraging', 'direct', 'friendly', 'patient', 'energetic', 'calm'
  )),
  feedback_style TEXT DEFAULT 'motivating' CHECK (feedback_style IN (
    'motivating', 'technical', 'gentle', 'challenging'
  )),
  
  -- JARVIS configuration
  language TEXT DEFAULT 'fr' CHECK (language IN ('fr', 'en', 'es', 'de', 'it')),
  voice_preference TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger updated_at
CREATE TRIGGER update_member_preferences_updated_at 
  BEFORE UPDATE ON member_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE member_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view preferences" ON member_preferences
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM gym_members_v2
      WHERE gym_id IN (
        SELECT gym_id FROM UNNEST(
          (SELECT gym_access FROM users WHERE id = auth.uid())
        ) AS gym_id
      )
    )
  );

-- ============================================================================
-- COMMENTS (documentation)
-- ============================================================================

COMMENT ON TABLE gym_members_v2 IS 'Profil core adhérents - NORMALISÉ (v2)';
COMMENT ON TABLE member_fitness_profile IS 'Module fitness séparé (optionnel)';
COMMENT ON TABLE member_preferences IS 'Préférences communication JARVIS';

COMMENT ON COLUMN gym_members_v2.badge_id IS 'Identifiant RFID/NFC unique adhérent';
COMMENT ON COLUMN gym_members_v2.membership_type IS 'Type abonnement (standard, premium, etc.)';
COMMENT ON COLUMN member_fitness_profile.primary_goals IS 'Array de goals: [perte_poids, muscle, endurance, etc.]';
COMMENT ON COLUMN member_fitness_profile.preferred_workout_times IS 'JSON: {morning: bool, afternoon: bool, evening: bool}';

