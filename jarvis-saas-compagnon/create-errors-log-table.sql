-- 🚨 Table des erreurs JARVIS pour monitoring admin
-- À exécuter dans Supabase SQL Editor

CREATE TABLE IF NOT EXISTS jarvis_errors_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type TEXT NOT NULL, -- 'voice_session_creation', 'api_timeout', etc.
  error_status INTEGER, -- HTTP status code (400, 500, etc.)
  error_details TEXT, -- Détails de l'erreur
  gym_slug TEXT, -- Slug de la salle concernée
  member_id TEXT, -- ID du membre si applicable
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB, -- Métadonnées additionnelles (source, api, model, etc.)
  resolved BOOLEAN DEFAULT false, -- Marquer comme résolu
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_jarvis_errors_log_timestamp ON jarvis_errors_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_jarvis_errors_log_type ON jarvis_errors_log(error_type);
CREATE INDEX IF NOT EXISTS idx_jarvis_errors_log_gym_slug ON jarvis_errors_log(gym_slug);
CREATE INDEX IF NOT EXISTS idx_jarvis_errors_log_resolved ON jarvis_errors_log(resolved);

-- ⚡ Trigger pour update automatique du updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour la table errors log
CREATE TRIGGER update_jarvis_errors_log_updated_at
  BEFORE UPDATE ON jarvis_errors_log
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE jarvis_errors_log ENABLE ROW LEVEL SECURITY;

-- Politique d'accès : lecture/écriture pour tous (admin app)
CREATE POLICY "Allow all operations on jarvis_errors_log" ON jarvis_errors_log
  FOR ALL USING (true);

-- 🧹 Fonction de nettoyage automatique (garder seulement 30 jours)
CREATE OR REPLACE FUNCTION cleanup_old_errors()
RETURNS void AS $$
BEGIN
  DELETE FROM jarvis_errors_log
  WHERE timestamp < now() - INTERVAL '30 days';
  
  -- Log le nettoyage
  INSERT INTO jarvis_errors_log (error_type, error_details, metadata)
  VALUES ('system_cleanup', 'Cleaned old error logs', '{"auto_cleanup": true}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Optionnel : Scheduler pour nettoyer automatiquement (si pg_cron est disponible)
-- SELECT cron.schedule('cleanup-errors', '0 2 * * *', 'SELECT cleanup_old_errors();');

-- ✅ Validation de la table
SELECT 
  'jarvis_errors_log table created successfully!' as result,
  count(*) as initial_records
FROM jarvis_errors_log; 