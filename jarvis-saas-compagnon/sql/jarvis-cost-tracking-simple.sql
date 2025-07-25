-- ==========================================
-- 💰 JARVIS Cost Tracking Table - VERSION SIMPLIFIÉE
-- Script SQL compatible Supabase sans problèmes d'immutabilité
-- ==========================================

-- UUID extension si pas déjà activée
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table principale de tracking des coûts
CREATE TABLE IF NOT EXISTS jarvis_session_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identification
  session_id VARCHAR(255) NOT NULL UNIQUE,
  gym_id UUID,
  franchise_id UUID,
  
  -- Timestamp
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Session metadata
  duration_seconds INTEGER DEFAULT 0,
  end_reason VARCHAR(50) DEFAULT 'user_ended',
  error_occurred BOOLEAN DEFAULT FALSE,
  user_satisfaction INTEGER CHECK (user_satisfaction >= 1 AND user_satisfaction <= 5),
  
  -- Token counts
  text_input_tokens INTEGER DEFAULT 0,
  text_output_tokens INTEGER DEFAULT 0,
  audio_input_tokens INTEGER DEFAULT 0,
  audio_output_tokens INTEGER DEFAULT 0,
  
  -- Costs in USD (4 decimal precision for accuracy)
  text_input_cost DECIMAL(10,4) DEFAULT 0.0000,
  text_output_cost DECIMAL(10,4) DEFAULT 0.0000,
  audio_input_cost DECIMAL(10,4) DEFAULT 0.0000,
  audio_output_cost DECIMAL(10,4) DEFAULT 0.0000,
  total_cost DECIMAL(10,4) DEFAULT 0.0000,
  
  -- Metadata additionnelle
  model_version VARCHAR(100),
  voice_type VARCHAR(50),
  
  CONSTRAINT valid_duration CHECK (duration_seconds >= 0),
  CONSTRAINT valid_tokens CHECK (
    text_input_tokens >= 0 AND 
    text_output_tokens >= 0 AND 
    audio_input_tokens >= 0 AND 
    audio_output_tokens >= 0
  ),
  CONSTRAINT valid_costs CHECK (
    text_input_cost >= 0 AND 
    text_output_cost >= 0 AND 
    audio_input_cost >= 0 AND 
    audio_output_cost >= 0 AND
    total_cost >= 0
  )
);

-- ==========================================
-- 📊 Indexes Simples pour Performance
-- ==========================================

-- Index basiques sans expressions complexes
CREATE INDEX IF NOT EXISTS idx_jarvis_costs_session_id ON jarvis_session_costs(session_id);
CREATE INDEX IF NOT EXISTS idx_jarvis_costs_gym_id ON jarvis_session_costs(gym_id);
CREATE INDEX IF NOT EXISTS idx_jarvis_costs_franchise_id ON jarvis_session_costs(franchise_id);
CREATE INDEX IF NOT EXISTS idx_jarvis_costs_timestamp ON jarvis_session_costs(timestamp);
CREATE INDEX IF NOT EXISTS idx_jarvis_costs_total_cost ON jarvis_session_costs(total_cost);
CREATE INDEX IF NOT EXISTS idx_jarvis_costs_error_occurred ON jarvis_session_costs(error_occurred);

-- ==========================================
-- 📝 RLS (Row Level Security)
-- ==========================================

-- Activer RLS sur la table
ALTER TABLE jarvis_session_costs ENABLE ROW LEVEL SECURITY;

-- Politique pour tous les utilisateurs authentifiés (simplifié)
CREATE POLICY "Authenticated users can access session costs"
  ON jarvis_session_costs
  FOR ALL
  TO authenticated
  USING (true);

-- ==========================================
-- 🎯 Trigger pour Calcul Automatique
-- ==========================================

-- Trigger pour calculer automatiquement total_cost
CREATE OR REPLACE FUNCTION calculate_total_cost()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_cost = COALESCE(NEW.text_input_cost, 0) + 
                   COALESCE(NEW.text_output_cost, 0) + 
                   COALESCE(NEW.audio_input_cost, 0) + 
                   COALESCE(NEW.audio_output_cost, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_total_cost
  BEFORE INSERT OR UPDATE ON jarvis_session_costs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_total_cost();

-- ==========================================
-- 📊 Données de Test (Optionnel)
-- ==========================================

-- Commentaires de fin
COMMENT ON TABLE jarvis_session_costs IS 'Table de tracking des coûts OpenAI Realtime API pour les sessions JARVIS';
COMMENT ON COLUMN jarvis_session_costs.session_id IS 'Identifiant unique de la session JARVIS';
COMMENT ON COLUMN jarvis_session_costs.total_cost IS 'Coût total de la session en USD (calculé automatiquement)';

-- ==========================================
-- ✅ Installation Terminée
-- ==========================================

-- Message de confirmation
SELECT 'Table jarvis_session_costs créée avec succès!' AS message; 