-- ===============================================
-- MVP SMART MEMBERS: Maximum contexte JARVIS 
-- ===============================================

-- Extensions necessaires
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- Pour recherche floue

-- ===============================================
-- 👥 GYM MEMBERS ENRICHI (Maximum de contexte)
-- ===============================================

-- Table principale enrichie
ALTER TABLE gym_members 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact JSONB,

-- 🎯 FITNESS PROFIL DÉTAILLÉ
ADD COLUMN IF NOT EXISTS fitness_level VARCHAR(30) DEFAULT 'beginner', -- beginner, intermediate, advanced, expert
ADD COLUMN IF NOT EXISTS fitness_goals JSONB DEFAULT '[]'::jsonb, -- ["lose_weight", "build_muscle", "endurance", "flexibility", "strength"]
ADD COLUMN IF NOT EXISTS target_weight_kg DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS current_weight_kg DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS height_cm INTEGER,
ADD COLUMN IF NOT EXISTS body_fat_percentage DECIMAL(4,2),

-- 🏋️ PRÉFÉRENCES WORKOUT 
ADD COLUMN IF NOT EXISTS preferred_workout_times JSONB DEFAULT '[]'::jsonb, -- ["06:00-08:00", "18:00-20:00"]
ADD COLUMN IF NOT EXISTS workout_frequency_per_week INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS preferred_workout_duration INTEGER DEFAULT 60, -- minutes
ADD COLUMN IF NOT EXISTS favorite_equipment JSONB DEFAULT '[]'::jsonb, -- ["treadmill", "weights", "rowing"]
ADD COLUMN IF NOT EXISTS avoided_equipment JSONB DEFAULT '[]'::jsonb, -- ["bicycle", "elliptical"]

-- 🍎 NUTRITION & SANTÉ
ADD COLUMN IF NOT EXISTS dietary_restrictions JSONB DEFAULT '[]'::jsonb, -- ["vegan", "gluten_free", "lactose_intolerant"]
ADD COLUMN IF NOT EXISTS allergies JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS medical_conditions JSONB DEFAULT '[]'::jsonb, -- ["knee_injury", "back_pain", "diabetes"]
ADD COLUMN IF NOT EXISTS medications JSONB DEFAULT '[]'::jsonb,

-- 🧘 PRÉFÉRENCES MENTALES & SOCIALES
ADD COLUMN IF NOT EXISTS motivation_type VARCHAR(30) DEFAULT 'health', -- health, aesthetics, performance, stress_relief
ADD COLUMN IF NOT EXISTS workout_style VARCHAR(30) DEFAULT 'moderate', -- gentle, moderate, intense, extreme
ADD COLUMN IF NOT EXISTS social_preference VARCHAR(30) DEFAULT 'mixed', -- solo, small_group, large_group, mixed
ADD COLUMN IF NOT EXISTS music_preferences JSONB DEFAULT '[]'::jsonb, -- ["pop", "rock", "electronic", "classical"]
ADD COLUMN IF NOT EXISTS coaching_interest BOOLEAN DEFAULT false,

-- 📊 STATISTIQUES COMPORTEMENTALES
ADD COLUMN IF NOT EXISTS avg_session_duration_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS favorite_visit_days JSONB DEFAULT '[]'::jsonb, -- ["monday", "wednesday", "friday"]
ADD COLUMN IF NOT EXISTS peak_visit_hours JSONB DEFAULT '[]'::jsonb, -- ["18:00", "19:00"]
ADD COLUMN IF NOT EXISTS consistency_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00 à 1.00
ADD COLUMN IF NOT EXISTS engagement_level VARCHAR(20) DEFAULT 'new', -- new, casual, regular, enthusiast, champion

-- 🎭 PROFIL CONVERSATIONNEL JARVIS
ADD COLUMN IF NOT EXISTS communication_style VARCHAR(30) DEFAULT 'friendly', -- formal, friendly, casual, motivational, humorous
ADD COLUMN IF NOT EXISTS conversation_topics_of_interest JSONB DEFAULT '[]'::jsonb, -- ["nutrition", "technique", "motivation", "progress"]
ADD COLUMN IF NOT EXISTS jarvis_interaction_frequency VARCHAR(20) DEFAULT 'normal', -- minimal, normal, frequent, extensive
ADD COLUMN IF NOT EXISTS preferred_feedback_style VARCHAR(30) DEFAULT 'encouraging', -- direct, encouraging, detailed, brief

-- 📈 TRACKING OBJECTIFS
ADD COLUMN IF NOT EXISTS current_goals JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS completed_goals JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS goal_achievement_rate DECIMAL(3,2) DEFAULT 0.00,

-- 🔄 MÉTA-DONNÉES
ADD COLUMN IF NOT EXISTS profile_completeness_percent INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS last_profile_update TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS jarvis_personalization_score DECIMAL(3,2) DEFAULT 0.00;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_gym_members_badge_active ON gym_members(badge_id, is_active);
CREATE INDEX IF NOT EXISTS idx_gym_members_gym_active ON gym_members(gym_id, is_active);
CREATE INDEX IF NOT EXISTS idx_gym_members_engagement ON gym_members(engagement_level);

-- ===============================================
-- 💬 LOGGING INTERACTIONS JARVIS TEMPS RÉEL
-- ===============================================

CREATE TABLE IF NOT EXISTS jarvis_conversation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contexte session
  session_id UUID NOT NULL, -- Lien avec openai_realtime_sessions
  member_id UUID REFERENCES gym_members(id),
  gym_id UUID NOT NULL,
  
  -- Message détaillé
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  speaker VARCHAR(10) NOT NULL CHECK (speaker IN ('user', 'jarvis')), 
  
  -- Contenu
  message_text TEXT NOT NULL,
  message_audio_url TEXT, -- URL S3/Supabase du fichier audio
  confidence_score DECIMAL(3,2), -- 0.00-1.00 pour transcription
  
  -- 🧠 ANALYSE IA TEMPS RÉEL
  detected_intent VARCHAR(100), -- question_hours, complaint, compliment, goal_update, etc.
  sentiment_score DECIMAL(3,2), -- -1.00 à 1.00 
  emotion_detected VARCHAR(50), -- happy, frustrated, motivated, tired, excited
  topic_category VARCHAR(50), -- equipment, schedule, nutrition, technique, motivation
  
  -- Entités extraites
  mentioned_equipment JSONB DEFAULT '[]'::jsonb,
  mentioned_activities JSONB DEFAULT '[]'::jsonb, 
  mentioned_goals JSONB DEFAULT '[]'::jsonb,
  mentioned_issues JSONB DEFAULT '[]'::jsonb,
  
  -- 📊 MÉTRIQUES CONVERSATION
  conversation_turn_number INTEGER NOT NULL,
  response_time_ms INTEGER, -- Temps de réponse JARVIS
  user_engagement_level VARCHAR(20), -- low, medium, high
  
  -- 🔍 FLAGS POUR ANALYSE FUTURE
  requires_follow_up BOOLEAN DEFAULT false,
  contains_feedback BOOLEAN DEFAULT false,
  contains_complaint BOOLEAN DEFAULT false,
  contains_goal_update BOOLEAN DEFAULT false,
  needs_human_review BOOLEAN DEFAULT false,
  
  -- Index pour queries rapides
  INDEX (session_id, conversation_turn_number),
  INDEX (member_id, timestamp DESC),
  INDEX (gym_id, timestamp DESC),
  INDEX (detected_intent),
  INDEX (needs_human_review) WHERE needs_human_review = true
);

-- ===============================================
-- 🧠 BASE DE CONNAISSANCE MEMBRE (Auto-générée)
-- ===============================================

CREATE TABLE IF NOT EXISTS member_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES gym_members(id),
  
  -- Type de connaissance
  knowledge_type VARCHAR(50) NOT NULL, -- preference, habit, goal, issue, achievement, personality
  category VARCHAR(50) NOT NULL, -- fitness, nutrition, schedule, equipment, social, health
  
  -- Contenu
  key_insight TEXT NOT NULL,
  confidence_level DECIMAL(3,2) NOT NULL DEFAULT 0.50, -- 0.00-1.00
  evidence_sources JSONB DEFAULT '[]'::jsonb, -- References aux conversation_logs
  
  -- Contexte temporel
  first_observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  times_observed INTEGER DEFAULT 1,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified_by_human BOOLEAN DEFAULT false,
  verification_notes TEXT,
  
  -- Meta
  created_by VARCHAR(20) DEFAULT 'ai_analysis', -- ai_analysis, human_input, system_inference
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Contrainte unicité
  UNIQUE(member_id, knowledge_type, key_insight),
  INDEX (member_id, is_active),
  INDEX (knowledge_type, confidence_level DESC),
  INDEX (last_confirmed_at DESC)
);

-- ===============================================
-- 📊 ANALYTICS SESSIONS ENRICHIES
-- ===============================================

CREATE TABLE IF NOT EXISTS member_session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES gym_members(id),
  session_id UUID NOT NULL, -- Lien avec jarvis session
  
  -- Timing
  session_date DATE NOT NULL,
  session_start TIMESTAMPTZ NOT NULL,
  session_end TIMESTAMPTZ,
  duration_minutes INTEGER,
  
  -- Conversation metrics
  total_exchanges INTEGER DEFAULT 0,
  user_initiated_topics INTEGER DEFAULT 0,
  jarvis_suggestions_accepted INTEGER DEFAULT 0,
  avg_sentiment_score DECIMAL(3,2),
  
  -- Insights extraits cette session
  new_preferences_discovered JSONB DEFAULT '[]'::jsonb,
  goals_mentioned JSONB DEFAULT '[]'::jsonb,
  issues_reported JSONB DEFAULT '[]'::jsonb,
  satisfaction_indicators JSONB DEFAULT '[]'::jsonb,
  
  -- Flags business
  high_engagement BOOLEAN DEFAULT false,
  contained_complaint BOOLEAN DEFAULT false,
  showed_interest_in_services BOOLEAN DEFAULT false,
  potential_churn_signals BOOLEAN DEFAULT false,
  
  INDEX (member_id, session_date DESC),
  INDEX (session_date, high_engagement),
  INDEX (contained_complaint) WHERE contained_complaint = true
);

-- ===============================================
-- 🔧 FONCTIONS UTILITAIRES
-- ===============================================

-- Fonction pour calculer le score de personnalisation
CREATE OR REPLACE FUNCTION calculate_personalization_score(member_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  score DECIMAL := 0.00;
  knowledge_count INTEGER;
  interaction_count INTEGER;
BEGIN
  -- Base sur la complétude du profil
  SELECT profile_completeness_percent::DECIMAL / 100 INTO score 
  FROM gym_members WHERE id = member_uuid;
  
  -- Bonus pour les interactions
  SELECT COUNT(*) INTO interaction_count
  FROM jarvis_conversation_logs 
  WHERE member_id = member_uuid 
  AND timestamp > NOW() - INTERVAL '30 days';
  
  -- Bonus pour la base de connaissance
  SELECT COUNT(*) INTO knowledge_count
  FROM member_knowledge_base 
  WHERE member_id = member_uuid AND is_active = true;
  
  -- Calcul final (0.00 à 1.00)
  score := LEAST(1.00, score + (interaction_count * 0.01) + (knowledge_count * 0.05));
  
  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le score automatiquement
CREATE OR REPLACE FUNCTION update_personalization_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE gym_members 
  SET jarvis_personalization_score = calculate_personalization_score(NEW.member_id)
  WHERE id = NEW.member_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur les logs de conversation
DROP TRIGGER IF EXISTS update_personalization_on_conversation ON jarvis_conversation_logs;
CREATE TRIGGER update_personalization_on_conversation
  AFTER INSERT ON jarvis_conversation_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_personalization_score();

-- ===============================================
-- 🔐 RLS POLICIES
-- ===============================================

-- RLS pour conversation logs (accès restreint par gym)
ALTER TABLE jarvis_conversation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS jarvis_logs_gym_access ON jarvis_conversation_logs;
CREATE POLICY jarvis_logs_gym_access ON jarvis_conversation_logs
  FOR ALL TO authenticated
  USING (
    gym_id IN (
      SELECT id FROM gyms WHERE manager_id = auth.uid()
    ) OR auth.role() = 'service_role'
  );

-- RLS pour knowledge base
ALTER TABLE member_knowledge_base ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS knowledge_base_gym_access ON member_knowledge_base;
CREATE POLICY knowledge_base_gym_access ON member_knowledge_base
  FOR ALL TO authenticated
  USING (
    member_id IN (
      SELECT gm.id FROM gym_members gm 
      JOIN gyms g ON gm.gym_id = g.id 
      WHERE g.manager_id = auth.uid()
    ) OR auth.role() = 'service_role'
  );

-- ===============================================
-- 📝 COMMENTAIRES & DOCUMENTATION
-- ===============================================

COMMENT ON TABLE gym_members IS 'Table principale des adhérents avec profil enrichi pour IA JARVIS';
COMMENT ON TABLE jarvis_conversation_logs IS 'Log temps réel de toutes les interactions JARVIS-adhérent';
COMMENT ON TABLE member_knowledge_base IS 'Base de connaissance auto-générée par IA sur chaque adhérent';
COMMENT ON TABLE member_session_analytics IS 'Analytics pré-calculées par session pour dashboard managers';

COMMENT ON COLUMN gym_members.jarvis_personalization_score IS 'Score 0-1 indiquant la qualité de personnalisation possible pour cet adhérent';
COMMENT ON COLUMN jarvis_conversation_logs.detected_intent IS 'Intent détecté automatiquement par IA (question, plainte, objectif, etc.)';
COMMENT ON COLUMN member_knowledge_base.confidence_level IS 'Niveau de confiance IA sur cette information (0=incertain, 1=très sûr)';
