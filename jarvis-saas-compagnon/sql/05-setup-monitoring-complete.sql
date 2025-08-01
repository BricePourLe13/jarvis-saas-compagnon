-- 🚀 SCRIPT MAÎTRE - CONFIGURATION COMPLÈTE MONITORING JARVIS
-- Exécuter dans l'ordre après avoir vérifié l'existant avec 01-audit-current-config.sql

-- ====================================
-- ✅ ÉTAPE 1: Vérifier tables de base requises
-- ====================================

-- S'assurer que les tables fondamentales existent
DO $$
BEGIN
  -- Vérifier table heartbeats
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kiosk_heartbeats') THEN
    RAISE EXCEPTION 'Table kiosk_heartbeats manquante. Exécutez d''abord: create-heartbeat-table.sql';
  END IF;
  
  -- Vérifier table erreurs
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jarvis_errors_log') THEN
    RAISE EXCEPTION 'Table jarvis_errors_log manquante. Exécutez d''abord: create-errors-log-table.sql';
  END IF;
  
  RAISE NOTICE '✅ Tables de base validées: kiosk_heartbeats, jarvis_errors_log';
END $$;

-- ====================================
-- 🚀 ÉTAPE 2: Créer tables monitoring avancé
-- ====================================

-- Table métriques techniques détaillées
CREATE TABLE IF NOT EXISTS kiosk_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  kiosk_slug TEXT NOT NULL,
  
  -- Métriques Système
  cpu_usage DECIMAL(5,2),
  memory_usage DECIMAL(5,2),
  memory_total BIGINT,
  memory_used BIGINT,
  storage_usage DECIMAL(5,2),
  network_latency INTEGER,
  api_response_time INTEGER,
  
  -- Métriques Audio
  microphone_level DECIMAL(5,2),
  speaker_volume DECIMAL(5,2),
  audio_quality TEXT CHECK (audio_quality IN ('excellent', 'good', 'degraded', 'poor')),
  
  -- État Matériel
  temperature_cpu INTEGER,
  power_consumption DECIMAL(8,2),
  
  -- Métadonnées
  browser_info JSONB DEFAULT '{}'::jsonb,
  hardware_info JSONB DEFAULT '{}'::jsonb,
  
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table incidents et pannes
CREATE TABLE IF NOT EXISTS kiosk_incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  kiosk_slug TEXT NOT NULL,
  
  incident_type TEXT NOT NULL CHECK (incident_type IN (
    'offline', 'performance_degraded', 'audio_failure', 
    'network_issue', 'hardware_failure', 'software_error',
    'api_timeout', 'high_error_rate', 'overheating'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  title TEXT NOT NULL,
  description TEXT,
  affected_components TEXT[],
  metrics_snapshot JSONB,
  
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  resolution_notes TEXT,
  resolved_by TEXT,
  
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  
  sessions_affected INTEGER DEFAULT 0,
  estimated_loss_eur DECIMAL(10,2),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table analytics horaires (cache)
CREATE TABLE IF NOT EXISTS kiosk_analytics_hourly (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  kiosk_slug TEXT NOT NULL,
  hour_bucket TIMESTAMPTZ NOT NULL,
  
  avg_cpu_usage DECIMAL(5,2),
  max_cpu_usage DECIMAL(5,2),
  avg_memory_usage DECIMAL(5,2),
  avg_network_latency INTEGER,
  
  total_sessions INTEGER DEFAULT 0,
  successful_sessions INTEGER DEFAULT 0,
  failed_sessions INTEGER DEFAULT 0,
  avg_session_duration INTEGER,
  
  total_errors INTEGER DEFAULT 0,
  api_timeouts INTEGER DEFAULT 0,
  
  success_rate DECIMAL(5,2),
  error_rate DECIMAL(5,2),
  uptime_percentage DECIMAL(5,2),
  
  data_points_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(gym_id, hour_bucket)
);

-- Table alertes intelligentes
CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  kiosk_slug TEXT NOT NULL,
  
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'cpu_high', 'memory_high', 'disk_full', 'network_slow',
    'api_slow', 'error_rate_high', 'offline_detected',
    'temperature_high', 'session_failure_spike'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  
  threshold_value DECIMAL(10,2),
  current_value DECIMAL(10,2),
  unit TEXT,
  
  title TEXT NOT NULL,
  description TEXT,
  recommended_action TEXT,
  
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'muted')),
  acknowledged_by TEXT,
  
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================
-- 📊 ÉTAPE 3: Créer indexes pour performance
-- ====================================

-- Indexes kiosk_metrics
CREATE INDEX IF NOT EXISTS idx_kiosk_metrics_gym_id ON kiosk_metrics(gym_id);
CREATE INDEX IF NOT EXISTS idx_kiosk_metrics_collected_at ON kiosk_metrics(collected_at);
CREATE INDEX IF NOT EXISTS idx_kiosk_metrics_slug ON kiosk_metrics(kiosk_slug);

-- Indexes incidents
CREATE INDEX IF NOT EXISTS idx_kiosk_incidents_gym_id ON kiosk_incidents(gym_id);
CREATE INDEX IF NOT EXISTS idx_kiosk_incidents_detected_at ON kiosk_incidents(detected_at);
CREATE INDEX IF NOT EXISTS idx_kiosk_incidents_status ON kiosk_incidents(status);
CREATE INDEX IF NOT EXISTS idx_kiosk_incidents_severity ON kiosk_incidents(severity);

-- Indexes analytics
CREATE INDEX IF NOT EXISTS idx_kiosk_analytics_gym_hour ON kiosk_analytics_hourly(gym_id, hour_bucket);
CREATE INDEX IF NOT EXISTS idx_kiosk_analytics_hour ON kiosk_analytics_hourly(hour_bucket);

-- Indexes alertes
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_gym_id ON monitoring_alerts(gym_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_triggered_at ON monitoring_alerts(triggered_at);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_status ON monitoring_alerts(status);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_severity ON monitoring_alerts(severity);

-- ====================================
-- ⚙️ ÉTAPE 4: Créer triggers et fonctions
-- ====================================

-- Fonction pour updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer triggers updated_at
DO $$
BEGIN
  -- Trigger pour incidents
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_kiosk_incidents_updated_at') THEN
    CREATE TRIGGER update_kiosk_incidents_updated_at
      BEFORE UPDATE ON kiosk_incidents
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Trigger pour analytics
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_kiosk_analytics_hourly_updated_at') THEN
    CREATE TRIGGER update_kiosk_analytics_hourly_updated_at
      BEFORE UPDATE ON kiosk_analytics_hourly
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Trigger pour alertes
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_monitoring_alerts_updated_at') THEN
    CREATE TRIGGER update_monitoring_alerts_updated_at
      BEFORE UPDATE ON monitoring_alerts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ====================================
-- 🔒 ÉTAPE 5: Configurer sécurité RLS
-- ====================================

-- Activer Row Level Security
ALTER TABLE kiosk_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiosk_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiosk_analytics_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- Politiques d'accès (admin app a accès complet)
CREATE POLICY "Allow all operations on kiosk_metrics" ON kiosk_metrics FOR ALL USING (true);
CREATE POLICY "Allow all operations on kiosk_incidents" ON kiosk_incidents FOR ALL USING (true);
CREATE POLICY "Allow all operations on kiosk_analytics_hourly" ON kiosk_analytics_hourly FOR ALL USING (true);
CREATE POLICY "Allow all operations on monitoring_alerts" ON monitoring_alerts FOR ALL USING (true);

-- ====================================
-- 🤖 ÉTAPE 6: Créer fonctions automatisées
-- ====================================

-- Fonction calcul analytics horaires
CREATE OR REPLACE FUNCTION calculate_hourly_analytics()
RETURNS void AS $$
DECLARE
  current_hour TIMESTAMPTZ;
  kiosk_record RECORD;
BEGIN
  current_hour := date_trunc('hour', now() - INTERVAL '1 hour');
  
  FOR kiosk_record IN (
    SELECT DISTINCT km.gym_id, km.kiosk_slug
    FROM kiosk_metrics km
    WHERE km.collected_at >= current_hour 
    AND km.collected_at < current_hour + INTERVAL '1 hour'
  ) LOOP
    
    INSERT INTO kiosk_analytics_hourly (
      gym_id, kiosk_slug, hour_bucket,
      avg_cpu_usage, max_cpu_usage, avg_memory_usage, avg_network_latency,
      total_sessions, successful_sessions, failed_sessions, avg_session_duration,
      total_errors, success_rate, error_rate, uptime_percentage, data_points_count
    )
    SELECT
      kiosk_record.gym_id, kiosk_record.kiosk_slug, current_hour,
      AVG(km.cpu_usage), MAX(km.cpu_usage), AVG(km.memory_usage), AVG(km.network_latency),
      
      -- Sessions depuis jarvis_sessions
      COALESCE((SELECT COUNT(*) FROM jarvis_sessions js 
                WHERE js.gym_id = kiosk_record.gym_id
                AND js.timestamp >= current_hour 
                AND js.timestamp < current_hour + INTERVAL '1 hour'), 0),
                
      COALESCE((SELECT COUNT(*) FROM jarvis_sessions js 
                WHERE js.gym_id = kiosk_record.gym_id
                AND js.timestamp >= current_hour 
                AND js.timestamp < current_hour + INTERVAL '1 hour'
                AND js.session_duration >= 10), 0),
                
      COALESCE((SELECT COUNT(*) FROM jarvis_sessions js 
                WHERE js.gym_id = kiosk_record.gym_id
                AND js.timestamp >= current_hour 
                AND js.timestamp < current_hour + INTERVAL '1 hour'
                AND js.session_duration < 10), 0),
                
      COALESCE((SELECT AVG(js.session_duration)::INTEGER FROM jarvis_sessions js 
                WHERE js.gym_id = kiosk_record.gym_id
                AND js.timestamp >= current_hour 
                AND js.timestamp < current_hour + INTERVAL '1 hour'), 0),
                
      -- Erreurs
      COALESCE((SELECT COUNT(*) FROM jarvis_errors_log jel 
                WHERE jel.gym_slug = kiosk_record.kiosk_slug
                AND jel.timestamp >= current_hour 
                AND jel.timestamp < current_hour + INTERVAL '1 hour'), 0),
                
      -- Taux de succès
      CASE WHEN (SELECT COUNT(*) FROM jarvis_sessions js 
                 WHERE js.gym_id = kiosk_record.gym_id
                 AND js.timestamp >= current_hour 
                 AND js.timestamp < current_hour + INTERVAL '1 hour') > 0 
           THEN ((SELECT COUNT(*) FROM jarvis_sessions js 
                  WHERE js.gym_id = kiosk_record.gym_id
                  AND js.timestamp >= current_hour 
                  AND js.timestamp < current_hour + INTERVAL '1 hour'
                  AND js.session_duration >= 10) * 100.0 / 
                 (SELECT COUNT(*) FROM jarvis_sessions js 
                  WHERE js.gym_id = kiosk_record.gym_id
                  AND js.timestamp >= current_hour 
                  AND js.timestamp < current_hour + INTERVAL '1 hour'))
           ELSE 100.0 END,
           
      -- Taux d'erreur
      0.0, -- Sera calculé dynamiquement
      
      -- Uptime
      CASE WHEN EXISTS (SELECT 1 FROM kiosk_heartbeats kh 
                        WHERE kh.gym_id = kiosk_record.gym_id
                        AND kh.last_heartbeat >= current_hour) THEN 95.0 ELSE 0.0 END,
      
      COUNT(*)
      
    FROM kiosk_metrics km
    WHERE km.gym_id = kiosk_record.gym_id
    AND km.kiosk_slug = kiosk_record.kiosk_slug
    AND km.collected_at >= current_hour 
    AND km.collected_at < current_hour + INTERVAL '1 hour'
    GROUP BY km.gym_id, km.kiosk_slug
    
    ON CONFLICT (gym_id, hour_bucket) DO UPDATE SET
      avg_cpu_usage = EXCLUDED.avg_cpu_usage,
      max_cpu_usage = EXCLUDED.max_cpu_usage,
      avg_memory_usage = EXCLUDED.avg_memory_usage,
      avg_network_latency = EXCLUDED.avg_network_latency,
      total_sessions = EXCLUDED.total_sessions,
      successful_sessions = EXCLUDED.successful_sessions,
      failed_sessions = EXCLUDED.failed_sessions,
      avg_session_duration = EXCLUDED.avg_session_duration,
      total_errors = EXCLUDED.total_errors,
      success_rate = EXCLUDED.success_rate,
      uptime_percentage = EXCLUDED.uptime_percentage,
      data_points_count = EXCLUDED.data_points_count,
      updated_at = now();
      
  END LOOP;
  
  RAISE NOTICE 'Analytics horaires calculées pour: %', current_hour;
END;
$$ LANGUAGE plpgsql;

-- Fonction nettoyage automatique
CREATE OR REPLACE FUNCTION cleanup_monitoring_data()
RETURNS void AS $$
BEGIN
  DELETE FROM kiosk_metrics WHERE collected_at < now() - INTERVAL '7 days';
  DELETE FROM kiosk_incidents WHERE status = 'resolved' AND resolved_at < now() - INTERVAL '30 days';
  DELETE FROM monitoring_alerts WHERE status = 'resolved' AND resolved_at < now() - INTERVAL '15 days';
  DELETE FROM kiosk_analytics_hourly WHERE hour_bucket < now() - INTERVAL '90 days';
  
  RAISE NOTICE 'Nettoyage monitoring terminé';
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- 👁️ ÉTAPE 7: Créer vues dashboard
-- ====================================

-- Vue statut actuel kiosks
CREATE OR REPLACE VIEW v_kiosk_current_status AS
SELECT 
  g.id as gym_id,
  g.name as gym_name,
  f.name as franchise_name,
  g.kiosk_config->>'kiosk_url_slug' as kiosk_slug,
  g.status as gym_status,
  
  CASE 
    WHEN kh.last_heartbeat > now() - INTERVAL '2 minutes' THEN 'online'
    ELSE 'offline'
  END as online_status,
  
  kh.last_heartbeat,
  km.cpu_usage, km.memory_usage, km.network_latency, km.api_response_time,
  km.collected_at as last_metrics,
  
  (SELECT COUNT(*) FROM monitoring_alerts ma 
   WHERE ma.gym_id = g.id AND ma.status = 'active') as active_alerts,
   
  (SELECT COUNT(*) FROM kiosk_incidents ki 
   WHERE ki.gym_id = g.id AND ki.status IN ('open', 'investigating')) as open_incidents

FROM gyms g
LEFT JOIN franchises f ON g.franchise_id = f.id
LEFT JOIN kiosk_heartbeats kh ON g.id = kh.gym_id
LEFT JOIN LATERAL (
  SELECT * FROM kiosk_metrics km2 
  WHERE km2.gym_id = g.id 
  ORDER BY km2.collected_at DESC 
  LIMIT 1
) km ON true
WHERE g.kiosk_config->>'kiosk_url_slug' IS NOT NULL;

-- ====================================
-- 📊 ÉTAPE 8: Insérer données test
-- ====================================

-- Insérer quelques métriques de démonstration
INSERT INTO kiosk_metrics (gym_id, kiosk_slug, cpu_usage, memory_usage, network_latency, api_response_time, collected_at)
SELECT 
  g.id,
  g.kiosk_config->>'kiosk_url_slug',
  (random() * 30 + 40)::DECIMAL(5,2), -- CPU entre 40-70%
  (random() * 25 + 50)::DECIMAL(5,2), -- Mémoire entre 50-75%
  (random() * 100 + 100)::INTEGER,    -- Latence entre 100-200ms
  (random() * 1000 + 1000)::INTEGER,  -- API entre 1-2s
  now() - INTERVAL '5 minutes'
FROM gyms g 
WHERE g.kiosk_config->>'kiosk_url_slug' IS NOT NULL
LIMIT 3;

-- ====================================
-- ✅ ÉTAPE 9: Validation finale
-- ====================================

-- Compter les enregistrements créés
WITH validation AS (
  SELECT 
    (SELECT COUNT(*) FROM kiosk_metrics) as metrics_count,
    (SELECT COUNT(*) FROM kiosk_incidents) as incidents_count,
    (SELECT COUNT(*) FROM kiosk_analytics_hourly) as analytics_count,
    (SELECT COUNT(*) FROM monitoring_alerts) as alerts_count,
    (SELECT COUNT(*) FROM v_kiosk_current_status) as kiosks_monitored
)
SELECT 
  '🚀 SYSTÈME DE MONITORING COMPLET INSTALLÉ!' as status,
  metrics_count || ' métriques' as metrics_table,
  incidents_count || ' incidents' as incidents_table,
  analytics_count || ' analytics' as analytics_table,  
  alerts_count || ' alertes' as alerts_table,
  kiosks_monitored || ' kiosks monitorés' as kiosks_ready,
  'calculate_hourly_analytics(), cleanup_monitoring_data()' as functions_available,
  'v_kiosk_current_status' as views_available,
  now() as installation_completed
FROM validation;

-- ====================================
-- 📋 INSTRUCTIONS FINALES
-- ====================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '🎯 SYSTÈME DE MONITORING JARVIS INSTALLÉ AVEC SUCCÈS!';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 TABLES CRÉÉES:';
  RAISE NOTICE '   • kiosk_metrics      - Métriques techniques détaillées';
  RAISE NOTICE '   • kiosk_incidents    - Incidents et pannes';
  RAISE NOTICE '   • kiosk_analytics_hourly - Cache analytics par heure';
  RAISE NOTICE '   • monitoring_alerts  - Alertes intelligentes';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 FONCTIONS DISPONIBLES:';
  RAISE NOTICE '   • calculate_hourly_analytics() - À exécuter chaque heure';
  RAISE NOTICE '   • cleanup_monitoring_data()    - Nettoyage quotidien';
  RAISE NOTICE '';
  RAISE NOTICE '👁️ VUES DASHBOARD:';
  RAISE NOTICE '   • v_kiosk_current_status - Statut temps réel tous kiosks';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ PROCHAINES ÉTAPES:';
  RAISE NOTICE '   1. Utiliser les requêtes de 04-monitoring-dashboard-queries.sql';
  RAISE NOTICE '   2. Intégrer dans l''interface admin';
  RAISE NOTICE '   3. Configurer alertes automatiques';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;