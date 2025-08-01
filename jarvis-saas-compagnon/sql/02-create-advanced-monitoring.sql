-- 🚀 SYSTÈME DE MONITORING AVANCÉ POUR KIOSKS JARVIS
-- Script complet pour mise en place monitoring professionnel

-- ====================================
-- 📊 TABLE: kiosk_metrics (Métriques techniques détaillées)
-- ====================================

CREATE TABLE IF NOT EXISTS kiosk_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  kiosk_slug TEXT NOT NULL,
  
  -- 💻 Métriques Système
  cpu_usage DECIMAL(5,2), -- Pourcentage CPU
  memory_usage DECIMAL(5,2), -- Pourcentage RAM
  memory_total BIGINT, -- RAM totale en MB
  memory_used BIGINT, -- RAM utilisée en MB
  storage_usage DECIMAL(5,2), -- Pourcentage stockage
  storage_total BIGINT, -- Stockage total en GB
  storage_used BIGINT, -- Stockage utilisé en GB
  
  -- 🌐 Métriques Réseau
  network_latency INTEGER, -- Ping en ms
  download_speed DECIMAL(10,2), -- Mbps
  upload_speed DECIMAL(10,2), -- Mbps
  network_quality TEXT CHECK (network_quality IN ('excellent', 'good', 'fair', 'poor')),
  
  -- 🎯 Métriques Performance
  api_response_time INTEGER, -- Temps réponse API OpenAI en ms
  average_session_time INTEGER, -- Durée moyenne session en secondes
  error_rate DECIMAL(5,2), -- Taux d'erreur pourcentage
  success_rate DECIMAL(5,2), -- Taux de succès pourcentage
  
  -- 🔊 Métriques Audio
  microphone_level DECIMAL(5,2), -- Niveau micro (0-100)
  speaker_volume DECIMAL(5,2), -- Volume haut-parleur (0-100)
  audio_quality TEXT CHECK (audio_quality IN ('excellent', 'good', 'degraded', 'poor')),
  
  -- 🔋 État Matériel
  temperature_cpu INTEGER, -- Température CPU en °C
  fan_speed INTEGER, -- Vitesse ventilateur en RPM
  power_consumption DECIMAL(8,2), -- Consommation électrique en watts
  
  -- 📈 Métadonnées
  browser_info JSONB, -- Infos navigateur
  os_info JSONB, -- Infos système d'exploitation
  hardware_info JSONB, -- Spécifications matériel
  
  -- ⏰ Timestamps
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_kiosk_metrics_gym_id ON kiosk_metrics(gym_id);
CREATE INDEX IF NOT EXISTS idx_kiosk_metrics_collected_at ON kiosk_metrics(collected_at);
CREATE INDEX IF NOT EXISTS idx_kiosk_metrics_slug ON kiosk_metrics(kiosk_slug);

-- ====================================
-- 🚨 TABLE: kiosk_incidents (Incidents & Pannes)
-- ====================================

CREATE TABLE IF NOT EXISTS kiosk_incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  kiosk_slug TEXT NOT NULL,
  
  -- 🏷️ Classification
  incident_type TEXT NOT NULL CHECK (incident_type IN (
    'offline', 'performance_degraded', 'audio_failure', 
    'network_issue', 'hardware_failure', 'software_error',
    'api_timeout', 'high_error_rate', 'overheating'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- 📋 Détails
  title TEXT NOT NULL,
  description TEXT,
  affected_components TEXT[], -- ['microphone', 'speakers', 'network', etc.]
  
  -- 📊 Métriques au moment de l'incident
  metrics_snapshot JSONB, -- Sauvegarde des métriques
  error_details JSONB, -- Détails techniques erreur
  
  -- 🔄 Statut & Résolution
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  resolution_notes TEXT,
  resolved_by TEXT, -- ID utilisateur qui a résolu
  
  -- ⏰ Timeline
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  duration_minutes INTEGER, -- Durée de l'incident
  
  -- 🏪 Impact Business
  sessions_affected INTEGER DEFAULT 0,
  estimated_loss_eur DECIMAL(10,2), -- Perte estimée en euros
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour incidents
CREATE INDEX IF NOT EXISTS idx_kiosk_incidents_gym_id ON kiosk_incidents(gym_id);
CREATE INDEX IF NOT EXISTS idx_kiosk_incidents_detected_at ON kiosk_incidents(detected_at);
CREATE INDEX IF NOT EXISTS idx_kiosk_incidents_status ON kiosk_incidents(status);
CREATE INDEX IF NOT EXISTS idx_kiosk_incidents_severity ON kiosk_incidents(severity);

-- ====================================
-- 📈 TABLE: kiosk_analytics_hourly (Cache métriques par heure)
-- ====================================

CREATE TABLE IF NOT EXISTS kiosk_analytics_hourly (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  kiosk_slug TEXT NOT NULL,
  hour_bucket TIMESTAMPTZ NOT NULL, -- Heure tronquée
  
  -- 📊 Agrégations Performance
  avg_cpu_usage DECIMAL(5,2),
  max_cpu_usage DECIMAL(5,2),
  avg_memory_usage DECIMAL(5,2),
  max_memory_usage DECIMAL(5,2),
  avg_network_latency INTEGER,
  max_network_latency INTEGER,
  
  -- 🎯 Métriques Sessions
  total_sessions INTEGER DEFAULT 0,
  successful_sessions INTEGER DEFAULT 0,
  failed_sessions INTEGER DEFAULT 0,
  avg_session_duration INTEGER,
  total_session_duration INTEGER,
  
  -- 🚨 Compteurs Erreurs
  total_errors INTEGER DEFAULT 0,
  api_timeouts INTEGER DEFAULT 0,
  audio_errors INTEGER DEFAULT 0,
  network_errors INTEGER DEFAULT 0,
  
  -- 📈 Calculs Dérivés
  success_rate DECIMAL(5,2),
  error_rate DECIMAL(5,2),
  uptime_percentage DECIMAL(5,2),
  
  -- ⏰ Métadonnées
  data_points_count INTEGER DEFAULT 0, -- Nombre de mesures agrégées
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contrainte unique par heure
  UNIQUE(gym_id, hour_bucket)
);

-- Index pour analytics
CREATE INDEX IF NOT EXISTS idx_kiosk_analytics_gym_hour ON kiosk_analytics_hourly(gym_id, hour_bucket);
CREATE INDEX IF NOT EXISTS idx_kiosk_analytics_hour ON kiosk_analytics_hourly(hour_bucket);

-- ====================================
-- 🔔 TABLE: monitoring_alerts (Alertes intelligentes)
-- ====================================

CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  kiosk_slug TEXT NOT NULL,
  
  -- 🏷️ Type & Seuil
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'cpu_high', 'memory_high', 'disk_full', 'network_slow',
    'api_slow', 'error_rate_high', 'offline_detected',
    'temperature_high', 'session_failure_spike'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  
  -- 📊 Seuils & Valeurs
  threshold_value DECIMAL(10,2), -- Seuil configuré
  current_value DECIMAL(10,2), -- Valeur actuelle
  unit TEXT, -- Unité (%, ms, MB, etc.)
  
  -- 📋 Détails
  title TEXT NOT NULL,
  description TEXT,
  recommended_action TEXT,
  
  -- 🔄 État
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'muted')),
  acknowledged_by TEXT, -- Utilisateur qui a acquitté
  muted_until TIMESTAMPTZ, -- Fin du mode silencieux
  
  -- 📈 Métrique liée
  metric_value JSONB, -- Snapshot de la métrique
  
  -- ⏰ Timeline
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour alertes
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_gym_id ON monitoring_alerts(gym_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_triggered_at ON monitoring_alerts(triggered_at);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_status ON monitoring_alerts(status);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_severity ON monitoring_alerts(severity);

-- ====================================
-- 🤖 TRIGGERS & FONCTIONS AUTOMATIQUES
-- ====================================

-- Trigger pour update automatique des updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger à toutes les tables
CREATE TRIGGER update_kiosk_metrics_updated_at
  BEFORE UPDATE ON kiosk_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kiosk_incidents_updated_at
  BEFORE UPDATE ON kiosk_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kiosk_analytics_hourly_updated_at
  BEFORE UPDATE ON kiosk_analytics_hourly
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monitoring_alerts_updated_at
  BEFORE UPDATE ON monitoring_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- 🔒 ROW LEVEL SECURITY
-- ====================================

-- Activer RLS sur toutes les tables
ALTER TABLE kiosk_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiosk_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiosk_analytics_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- Politiques d'accès (pour admin app)
CREATE POLICY "Allow all operations on kiosk_metrics" ON kiosk_metrics FOR ALL USING (true);
CREATE POLICY "Allow all operations on kiosk_incidents" ON kiosk_incidents FOR ALL USING (true);
CREATE POLICY "Allow all operations on kiosk_analytics_hourly" ON kiosk_analytics_hourly FOR ALL USING (true);
CREATE POLICY "Allow all operations on monitoring_alerts" ON monitoring_alerts FOR ALL USING (true);

-- ====================================
-- ✅ VALIDATION & RÉSULTAT
-- ====================================

SELECT 
  '🚀 Système de monitoring avancé créé avec succès!' as result,
  'Tables: kiosk_metrics, kiosk_incidents, kiosk_analytics_hourly, monitoring_alerts' as tables_created,
  now() as created_at;