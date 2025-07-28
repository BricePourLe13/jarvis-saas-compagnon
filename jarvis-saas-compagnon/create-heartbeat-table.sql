-- 💓 Table des heartbeats kiosk pour tracking temps réel
-- À exécuter dans Supabase SQL Editor

CREATE TABLE IF NOT EXISTS kiosk_heartbeats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  kiosk_slug TEXT NOT NULL,
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Index pour performance
  UNIQUE(gym_id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_kiosk_heartbeats_gym_id ON kiosk_heartbeats(gym_id);
CREATE INDEX IF NOT EXISTS idx_kiosk_heartbeats_last_heartbeat ON kiosk_heartbeats(last_heartbeat);
CREATE INDEX IF NOT EXISTS idx_kiosk_heartbeats_status ON kiosk_heartbeats(status);

-- ⚡ Fonction pour nettoyer automatiquement les anciens heartbeats (optimisée)
CREATE OR REPLACE FUNCTION cleanup_old_heartbeats()
RETURNS void AS $$
BEGIN
  -- ⚡ Marquer comme offline les heartbeats de plus de 45 secondes
  UPDATE kiosk_heartbeats 
  SET status = 'offline', updated_at = now()
  WHERE last_heartbeat < now() - INTERVAL '45 seconds' 
  AND status = 'online';
  
  -- Supprimer les heartbeats de plus d'1 heure
  DELETE FROM kiosk_heartbeats 
  WHERE last_heartbeat < now() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Trigger pour update automatique du updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kiosk_heartbeats_updated_at
  BEFORE UPDATE ON kiosk_heartbeats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE kiosk_heartbeats ENABLE ROW LEVEL SECURITY;

-- Policy pour permettre lecture/écriture (ajustez selon vos besoins)
CREATE POLICY "Allow all operations on kiosk_heartbeats" ON kiosk_heartbeats
  FOR ALL USING (true);

-- Optionnel : Scheduler pour nettoyer automatiquement (si pg_cron est disponible)
-- SELECT cron.schedule('cleanup-heartbeats', '*/5 * * * *', 'SELECT cleanup_old_heartbeats();'); 