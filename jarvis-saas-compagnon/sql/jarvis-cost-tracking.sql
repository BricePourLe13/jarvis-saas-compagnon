-- ==========================================
-- 💰 JARVIS Cost Tracking Table
-- Table pour tracker les coûts OpenAI Realtime API
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
  duration_seconds INTEGER NOT NULL DEFAULT 0,
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
-- 📊 Indexes pour Performance
-- ==========================================

-- Index sur session_id (unique key performance)
CREATE UNIQUE INDEX IF NOT EXISTS idx_jarvis_costs_session_id 
ON jarvis_session_costs(session_id);

-- Index sur gym_id pour filtrage par salle
CREATE INDEX IF NOT EXISTS idx_jarvis_costs_gym_id 
ON jarvis_session_costs(gym_id);

-- Index sur franchise_id pour filtrage par franchise
CREATE INDEX IF NOT EXISTS idx_jarvis_costs_franchise_id 
ON jarvis_session_costs(franchise_id);

-- Index sur timestamp pour requêtes temporelles
CREATE INDEX IF NOT EXISTS idx_jarvis_costs_timestamp 
ON jarvis_session_costs(timestamp);

-- Index séparés pour éviter les problèmes d'immutabilité
-- Les requêtes utiliseront les index séparés (légèrement moins optimal mais fonctionnel)
-- CREATE INDEX gym_date et franchise_date supprimés pour éviter l'erreur 42P17

-- Index sur total_cost pour les rapports financiers
CREATE INDEX IF NOT EXISTS idx_jarvis_costs_total_cost 
ON jarvis_session_costs(total_cost);

-- Index sur error_occurred pour les rapports de qualité
CREATE INDEX IF NOT EXISTS idx_jarvis_costs_error_occurred 
ON jarvis_session_costs(error_occurred);

-- ==========================================
-- 📈 Vues Matérialisées pour Analytics
-- ==========================================

-- Vue pour les coûts quotidiens par gym
CREATE OR REPLACE VIEW daily_costs_by_gym AS
SELECT 
  gym_id,
  timestamp::date as date,
  COUNT(*) as total_sessions,
  SUM(duration_seconds) as total_duration_seconds,
  ROUND(SUM(duration_seconds)::DECIMAL / 60, 2) as total_duration_minutes,
  SUM(text_input_tokens) as total_text_input_tokens,
  SUM(text_output_tokens) as total_text_output_tokens,
  SUM(audio_input_tokens) as total_audio_input_tokens,
  SUM(audio_output_tokens) as total_audio_output_tokens,
  SUM(total_cost) as total_cost_usd,
  ROUND(AVG(total_cost), 4) as average_session_cost,
  ROUND(AVG(user_satisfaction), 2) as average_satisfaction,
  COUNT(CASE WHEN error_occurred = false THEN 1 END)::DECIMAL / COUNT(*) * 100 as success_rate_percent
FROM jarvis_session_costs 
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY gym_id, timestamp::date;

-- Vue pour les coûts quotidiens par franchise
CREATE OR REPLACE VIEW daily_costs_by_franchise AS
SELECT 
  franchise_id,
  timestamp::date as date,
  COUNT(*) as total_sessions,
  SUM(duration_seconds) as total_duration_seconds,
  ROUND(SUM(duration_seconds)::DECIMAL / 60, 2) as total_duration_minutes,
  SUM(text_input_tokens) as total_text_input_tokens,
  SUM(text_output_tokens) as total_text_output_tokens,
  SUM(audio_input_tokens) as total_audio_input_tokens,
  SUM(audio_output_tokens) as total_audio_output_tokens,
  SUM(total_cost) as total_cost_usd,
  ROUND(AVG(total_cost), 4) as average_session_cost,
  ROUND(AVG(user_satisfaction), 2) as average_satisfaction,
  COUNT(CASE WHEN error_occurred = false THEN 1 END)::DECIMAL / COUNT(*) * 100 as success_rate_percent
FROM jarvis_session_costs 
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY franchise_id, timestamp::date;

-- ==========================================
-- 📝 RLS (Row Level Security)
-- ==========================================

-- Activer RLS sur la table
ALTER TABLE jarvis_session_costs ENABLE ROW LEVEL SECURITY;

-- Politique simple pour tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can access session costs"
  ON jarvis_session_costs
  FOR ALL
  TO authenticated
  USING (true);

-- ==========================================
-- 🔧 Fonctions Utilitaires
-- ==========================================

-- Fonction pour calculer les coûts mensuels d'une franchise
CREATE OR REPLACE FUNCTION get_monthly_costs_by_franchise(
  target_franchise_id UUID,
  target_month DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_sessions BIGINT,
  total_cost_usd DECIMAL,
  total_cost_eur DECIMAL,
  average_session_cost DECIMAL,
  success_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT,
    SUM(jsc.total_cost),
    ROUND(SUM(jsc.total_cost) * 0.85, 2), -- Conversion approximative USD -> EUR
    ROUND(AVG(jsc.total_cost), 4),
    ROUND(COUNT(CASE WHEN jsc.error_occurred = false THEN 1 END)::DECIMAL / COUNT(*) * 100, 2)
  FROM jarvis_session_costs jsc
  WHERE jsc.franchise_id = target_franchise_id
    AND DATE_TRUNC('month', jsc.timestamp) = DATE_TRUNC('month', target_month::timestamp);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les heures de pointe d'une salle
CREATE OR REPLACE FUNCTION get_peak_hours_by_gym(
  target_gym_id UUID,
  days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
  hour_of_day INTEGER,
  session_count BIGINT,
  avg_cost DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(HOUR FROM jsc.timestamp)::INTEGER,
    COUNT(*)::BIGINT,
    ROUND(AVG(jsc.total_cost), 4)
  FROM jarvis_session_costs jsc
  WHERE jsc.gym_id = target_gym_id
    AND jsc.timestamp >= CURRENT_DATE - INTERVAL '1 day' * days_back
  GROUP BY EXTRACT(HOUR FROM jsc.timestamp)
  ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 🎯 Triggers pour Mise à Jour Automatique
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

-- Insérer quelques sessions de test si nécessaire
-- (Décommentez si vous voulez des données de démonstration)

/*
INSERT INTO jarvis_session_costs (
  session_id, gym_id, timestamp, duration_seconds,
  text_input_tokens, text_output_tokens, audio_input_tokens, audio_output_tokens,
  text_input_cost, text_output_cost, audio_input_cost, audio_output_cost,
  user_satisfaction, error_occurred, end_reason
) VALUES 
  ('demo-session-1', (SELECT id FROM gyms LIMIT 1), NOW() - INTERVAL '2 hours', 
   150, 120, 80, 2500, 4200, 0.0006, 0.0012, 0.25, 0.84, 5, false, 'user_ended'),
  ('demo-session-2', (SELECT id FROM gyms LIMIT 1), NOW() - INTERVAL '1 hour', 
   95, 85, 55, 1580, 2750, 0.0004, 0.0008, 0.16, 0.55, 4, false, 'user_ended'),
  ('demo-session-3', (SELECT id FROM gyms LIMIT 1), NOW() - INTERVAL '30 minutes', 
   200, 150, 120, 3330, 5000, 0.0008, 0.0018, 0.33, 1.00, 3, true, 'error');
*/

-- ==========================================
-- ✅ Installation Terminée
-- ==========================================

-- Commentaires de fin
COMMENT ON TABLE jarvis_session_costs IS 'Table de tracking des coûts OpenAI Realtime API pour les sessions JARVIS';
COMMENT ON COLUMN jarvis_session_costs.session_id IS 'Identifiant unique de la session JARVIS';
COMMENT ON COLUMN jarvis_session_costs.total_cost IS 'Coût total de la session en USD (calculé automatiquement)';
COMMENT ON COLUMN jarvis_session_costs.user_satisfaction IS 'Note de satisfaction utilisateur (1-5)';

-- ==========================================
-- ✅ Installation Terminée
-- ==========================================

-- Message de confirmation
SELECT 'Table jarvis_session_costs créée avec succès!' AS message; 