-- 🔧 FONCTIONS AVANCÉES POUR LE MONITORING JARVIS
-- Fonctions automatiques de calcul, alertes et nettoyage

-- ====================================
-- 📊 FONCTION: Calculer métriques horaires
-- ====================================

CREATE OR REPLACE FUNCTION calculate_hourly_analytics()
RETURNS void AS $$
DECLARE
  current_hour TIMESTAMPTZ;
  kiosk_record RECORD;
BEGIN
  -- Calculer pour l'heure précédente complète
  current_hour := date_trunc('hour', now() - INTERVAL '1 hour');
  
  -- Pour chaque kiosk actif
  FOR kiosk_record IN (
    SELECT DISTINCT 
      km.gym_id,
      km.kiosk_slug
    FROM kiosk_metrics km
    WHERE km.collected_at >= current_hour 
    AND km.collected_at < current_hour + INTERVAL '1 hour'
  ) LOOP
    
    -- Insérer ou mettre à jour les analytics horaires
    INSERT INTO kiosk_analytics_hourly (
      gym_id,
      kiosk_slug,
      hour_bucket,
      avg_cpu_usage,
      max_cpu_usage,
      avg_memory_usage,
      max_memory_usage,
      avg_network_latency,
      max_network_latency,
      total_sessions,
      successful_sessions,
      failed_sessions,
      avg_session_duration,
      total_session_duration,
      total_errors,
      api_timeouts,
      audio_errors,
      network_errors,
      success_rate,
      error_rate,
      uptime_percentage,
      data_points_count
    )
    SELECT
      kiosk_record.gym_id,
      kiosk_record.kiosk_slug,
      current_hour,
      
      -- Moyennes métriques système
      AVG(km.cpu_usage),
      MAX(km.cpu_usage),
      AVG(km.memory_usage),
      MAX(km.memory_usage),
      AVG(km.network_latency),
      MAX(km.network_latency),
      
      -- Comptage sessions (depuis jarvis_sessions)
      COALESCE((
        SELECT COUNT(*) 
        FROM jarvis_sessions js 
        WHERE js.gym_id = kiosk_record.gym_id
        AND js.timestamp >= current_hour 
        AND js.timestamp < current_hour + INTERVAL '1 hour'
      ), 0),
      
      -- Sessions réussies (durée > 10 secondes)
      COALESCE((
        SELECT COUNT(*) 
        FROM jarvis_sessions js 
        WHERE js.gym_id = kiosk_record.gym_id
        AND js.timestamp >= current_hour 
        AND js.timestamp < current_hour + INTERVAL '1 hour'
        AND js.session_duration >= 10
      ), 0),
      
      -- Sessions échouées (durée < 10 secondes)
      COALESCE((
        SELECT COUNT(*) 
        FROM jarvis_sessions js 
        WHERE js.gym_id = kiosk_record.gym_id
        AND js.timestamp >= current_hour 
        AND js.timestamp < current_hour + INTERVAL '1 hour'
        AND js.session_duration < 10
      ), 0),
      
      -- Durée moyenne et totale sessions
      COALESCE((
        SELECT AVG(js.session_duration)::INTEGER 
        FROM jarvis_sessions js 
        WHERE js.gym_id = kiosk_record.gym_id
        AND js.timestamp >= current_hour 
        AND js.timestamp < current_hour + INTERVAL '1 hour'
      ), 0),
      
      COALESCE((
        SELECT SUM(js.session_duration) 
        FROM jarvis_sessions js 
        WHERE js.gym_id = kiosk_record.gym_id
        AND js.timestamp >= current_hour 
        AND js.timestamp < current_hour + INTERVAL '1 hour'
      ), 0),
      
      -- Erreurs (depuis jarvis_errors_log si existe)
      COALESCE((
        SELECT COUNT(*) 
        FROM jarvis_errors_log jel 
        WHERE jel.gym_slug = kiosk_record.kiosk_slug
        AND jel.timestamp >= current_hour 
        AND jel.timestamp < current_hour + INTERVAL '1 hour'
      ), 0),
      
      -- API timeouts spécifiques
      COALESCE((
        SELECT COUNT(*) 
        FROM jarvis_errors_log jel 
        WHERE jel.gym_slug = kiosk_record.kiosk_slug
        AND jel.timestamp >= current_hour 
        AND jel.timestamp < current_hour + INTERVAL '1 hour'
        AND jel.error_type = 'api_timeout'
      ), 0),
      
      -- Erreurs audio
      COALESCE((
        SELECT COUNT(*) 
        FROM jarvis_errors_log jel 
        WHERE jel.gym_slug = kiosk_record.kiosk_slug
        AND jel.timestamp >= current_hour 
        AND jel.timestamp < current_hour + INTERVAL '1 hour'
        AND jel.error_type LIKE '%audio%'
      ), 0),
      
      -- Erreurs réseau
      COALESCE((
        SELECT COUNT(*) 
        FROM jarvis_errors_log jel 
        WHERE jel.gym_slug = kiosk_record.kiosk_slug
        AND jel.timestamp >= current_hour 
        AND jel.timestamp < current_hour + INTERVAL '1 hour'
        AND jel.error_type LIKE '%network%'
      ), 0),
      
      -- Calculs dérivés
      CASE 
        WHEN COALESCE((
          SELECT COUNT(*) 
          FROM jarvis_sessions js 
          WHERE js.gym_id = kiosk_record.gym_id
          AND js.timestamp >= current_hour 
          AND js.timestamp < current_hour + INTERVAL '1 hour'
        ), 0) > 0 THEN
          (COALESCE((
            SELECT COUNT(*) 
            FROM jarvis_sessions js 
            WHERE js.gym_id = kiosk_record.gym_id
            AND js.timestamp >= current_hour 
            AND js.timestamp < current_hour + INTERVAL '1 hour'
            AND js.session_duration >= 10
          ), 0) * 100.0 / COALESCE((
            SELECT COUNT(*) 
            FROM jarvis_sessions js 
            WHERE js.gym_id = kiosk_record.gym_id
            AND js.timestamp >= current_hour 
            AND js.timestamp < current_hour + INTERVAL '1 hour'
          ), 1))
        ELSE 100.0
      END as success_rate,
      
      -- Taux d'erreur
      CASE 
        WHEN COALESCE((
          SELECT COUNT(*) 
          FROM jarvis_sessions js 
          WHERE js.gym_id = kiosk_record.gym_id
          AND js.timestamp >= current_hour 
          AND js.timestamp < current_hour + INTERVAL '1 hour'
        ), 0) > 0 THEN
          (COALESCE((
            SELECT COUNT(*) 
            FROM jarvis_errors_log jel 
            WHERE jel.gym_slug = kiosk_record.kiosk_slug
            AND jel.timestamp >= current_hour 
            AND jel.timestamp < current_hour + INTERVAL '1 hour'
          ), 0) * 100.0 / COALESCE((
            SELECT COUNT(*) 
            FROM jarvis_sessions js 
            WHERE js.gym_id = kiosk_record.gym_id
            AND js.timestamp >= current_hour 
            AND js.timestamp < current_hour + INTERVAL '1 hour'
          ), 1))
        ELSE 0.0
      END as error_rate,
      
      -- Uptime (basé sur heartbeats)
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM kiosk_heartbeats kh 
          WHERE kh.gym_id = kiosk_record.gym_id
          AND kh.last_heartbeat >= current_hour
          AND kh.last_heartbeat < current_hour + INTERVAL '1 hour'
        ) THEN 95.0 -- Approximation si heartbeats présents
        ELSE 0.0
      END as uptime_percentage,
      
      -- Nombre de points de données
      COUNT(*)
      
    FROM kiosk_metrics km
    WHERE km.gym_id = kiosk_record.gym_id
    AND km.kiosk_slug = kiosk_record.kiosk_slug
    AND km.collected_at >= current_hour 
    AND km.collected_at < current_hour + INTERVAL '1 hour'
    GROUP BY km.gym_id, km.kiosk_slug
    
    ON CONFLICT (gym_id, hour_bucket) 
    DO UPDATE SET
      avg_cpu_usage = EXCLUDED.avg_cpu_usage,
      max_cpu_usage = EXCLUDED.max_cpu_usage,
      avg_memory_usage = EXCLUDED.avg_memory_usage,
      max_memory_usage = EXCLUDED.max_memory_usage,
      avg_network_latency = EXCLUDED.avg_network_latency,
      max_network_latency = EXCLUDED.max_network_latency,
      total_sessions = EXCLUDED.total_sessions,
      successful_sessions = EXCLUDED.successful_sessions,
      failed_sessions = EXCLUDED.failed_sessions,
      avg_session_duration = EXCLUDED.avg_session_duration,
      total_session_duration = EXCLUDED.total_session_duration,
      total_errors = EXCLUDED.total_errors,
      api_timeouts = EXCLUDED.api_timeouts,
      audio_errors = EXCLUDED.audio_errors,
      network_errors = EXCLUDED.network_errors,
      success_rate = EXCLUDED.success_rate,
      error_rate = EXCLUDED.error_rate,
      uptime_percentage = EXCLUDED.uptime_percentage,
      data_points_count = EXCLUDED.data_points_count,
      updated_at = now();
      
  END LOOP;
  
  RAISE NOTICE 'Analytics horaires calculées pour: %', current_hour;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- 🚨 FONCTION: Détecter alertes automatiques
-- ====================================

CREATE OR REPLACE FUNCTION check_monitoring_alerts()
RETURNS void AS $$
DECLARE
  kiosk_record RECORD;
  alert_exists BOOLEAN;
BEGIN
  -- Vérifier chaque kiosk avec métriques récentes
  FOR kiosk_record IN (
    SELECT DISTINCT 
      km.gym_id,
      km.kiosk_slug,
      AVG(km.cpu_usage) as avg_cpu,
      MAX(km.cpu_usage) as max_cpu,
      AVG(km.memory_usage) as avg_memory,
      MAX(km.memory_usage) as max_memory,
      AVG(km.network_latency) as avg_latency,
      MAX(km.network_latency) as max_latency,
      AVG(km.api_response_time) as avg_api_time,
      MAX(km.api_response_time) as max_api_time,
      MAX(km.temperature_cpu) as max_temp
    FROM kiosk_metrics km
    WHERE km.collected_at > now() - INTERVAL '10 minutes'
    GROUP BY km.gym_id, km.kiosk_slug
  ) LOOP
    
    -- ALERTE: CPU élevé (>85%)
    IF kiosk_record.avg_cpu > 85 THEN
      SELECT EXISTS(
        SELECT 1 FROM monitoring_alerts 
        WHERE gym_id = kiosk_record.gym_id 
        AND alert_type = 'cpu_high' 
        AND status = 'active'
      ) INTO alert_exists;
      
      IF NOT alert_exists THEN
        INSERT INTO monitoring_alerts (
          gym_id, kiosk_slug, alert_type, severity,
          threshold_value, current_value, unit,
          title, description, recommended_action
        ) VALUES (
          kiosk_record.gym_id, kiosk_record.kiosk_slug,
          'cpu_high', 'warning',
          85, kiosk_record.avg_cpu, '%',
          'CPU élevé détecté',
          format('Utilisation CPU moyenne: %.1f%% (seuil: 85%%)', kiosk_record.avg_cpu),
          'Vérifier les processus en cours et redémarrer si nécessaire'
        );
      END IF;
    END IF;
    
    -- ALERTE: Mémoire élevée (>90%)
    IF kiosk_record.avg_memory > 90 THEN
      SELECT EXISTS(
        SELECT 1 FROM monitoring_alerts 
        WHERE gym_id = kiosk_record.gym_id 
        AND alert_type = 'memory_high' 
        AND status = 'active'
      ) INTO alert_exists;
      
      IF NOT alert_exists THEN
        INSERT INTO monitoring_alerts (
          gym_id, kiosk_slug, alert_type, severity,
          threshold_value, current_value, unit,
          title, description, recommended_action
        ) VALUES (
          kiosk_record.gym_id, kiosk_record.kiosk_slug,
          'memory_high', 'error',
          90, kiosk_record.avg_memory, '%',
          'Mémoire critique',
          format('Utilisation mémoire: %.1f%% (seuil: 90%%)', kiosk_record.avg_memory),
          'Redémarrage requis pour libérer la mémoire'
        );
      END IF;
    END IF;
    
    -- ALERTE: Latence réseau élevée (>500ms)
    IF kiosk_record.avg_latency > 500 THEN
      SELECT EXISTS(
        SELECT 1 FROM monitoring_alerts 
        WHERE gym_id = kiosk_record.gym_id 
        AND alert_type = 'network_slow' 
        AND status = 'active'
      ) INTO alert_exists;
      
      IF NOT alert_exists THEN
        INSERT INTO monitoring_alerts (
          gym_id, kiosk_slug, alert_type, severity,
          threshold_value, current_value, unit,
          title, description, recommended_action
        ) VALUES (
          kiosk_record.gym_id, kiosk_record.kiosk_slug,
          'network_slow', 'warning',
          500, kiosk_record.avg_latency, 'ms',
          'Réseau lent détecté',
          format('Latence moyenne: %s ms (seuil: 500ms)', kiosk_record.avg_latency),
          'Vérifier la connexion internet et contacter le support technique'
        );
      END IF;
    END IF;
    
    -- ALERTE: API lente (>3000ms)
    IF kiosk_record.avg_api_time > 3000 THEN
      SELECT EXISTS(
        SELECT 1 FROM monitoring_alerts 
        WHERE gym_id = kiosk_record.gym_id 
        AND alert_type = 'api_slow' 
        AND status = 'active'
      ) INTO alert_exists;
      
      IF NOT alert_exists THEN
        INSERT INTO monitoring_alerts (
          gym_id, kiosk_slug, alert_type, severity,
          threshold_value, current_value, unit,
          title, description, recommended_action
        ) VALUES (
          kiosk_record.gym_id, kiosk_record.kiosk_slug,
          'api_slow', 'error',
          3000, kiosk_record.avg_api_time, 'ms',
          'API OpenAI lente',
          format('Temps réponse API: %s ms (seuil: 3000ms)', kiosk_record.avg_api_time),
          'Problème possible avec OpenAI - vérifier les quotas et la connectivité'
        );
      END IF;
    END IF;
    
    -- ALERTE: Température élevée (>80°C)
    IF kiosk_record.max_temp > 80 THEN
      SELECT EXISTS(
        SELECT 1 FROM monitoring_alerts 
        WHERE gym_id = kiosk_record.gym_id 
        AND alert_type = 'temperature_high' 
        AND status = 'active'
      ) INTO alert_exists;
      
      IF NOT alert_exists THEN
        INSERT INTO monitoring_alerts (
          gym_id, kiosk_slug, alert_type, severity,
          threshold_value, current_value, unit,
          title, description, recommended_action
        ) VALUES (
          kiosk_record.gym_id, kiosk_record.kiosk_slug,
          'temperature_high', 'critical',
          80, kiosk_record.max_temp, '°C',
          'Surchauffe détectée',
          format('Température CPU: %s°C (seuil: 80°C)', kiosk_record.max_temp),
          'URGENT: Vérifier la ventilation et éteindre si nécessaire'
        );
      END IF;
    END IF;
    
  END LOOP;
  
  RAISE NOTICE 'Vérification alertes terminée';
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- 🧹 FONCTION: Nettoyage automatique
-- ====================================

CREATE OR REPLACE FUNCTION cleanup_monitoring_data()
RETURNS void AS $$
BEGIN
  -- Nettoyer métriques anciennes (garder 7 jours)
  DELETE FROM kiosk_metrics 
  WHERE collected_at < now() - INTERVAL '7 days';
  
  -- Nettoyer incidents résolus anciens (garder 30 jours)
  DELETE FROM kiosk_incidents 
  WHERE status = 'resolved' 
  AND resolved_at < now() - INTERVAL '30 days';
  
  -- Nettoyer alertes résolues anciennes (garder 15 jours)
  DELETE FROM monitoring_alerts 
  WHERE status = 'resolved' 
  AND resolved_at < now() - INTERVAL '15 days';
  
  -- Nettoyer analytics horaires anciens (garder 90 jours)
  DELETE FROM kiosk_analytics_hourly 
  WHERE hour_bucket < now() - INTERVAL '90 days';
  
  RAISE NOTICE 'Nettoyage monitoring terminé';
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- 📊 VUES PRATIQUES POUR DASHBOARDS
-- ====================================

-- Vue: Statut actuel de tous les kiosks
CREATE OR REPLACE VIEW v_kiosk_current_status AS
SELECT 
  g.id as gym_id,
  g.name as gym_name,
  f.name as franchise_name,
  g.kiosk_config->>'kiosk_url_slug' as kiosk_slug,
  g.status as gym_status,
  
  -- Statut heartbeat
  CASE 
    WHEN kh.last_heartbeat > now() - INTERVAL '2 minutes' 
    THEN 'online'
    ELSE 'offline'
  END as online_status,
  
  kh.last_heartbeat,
  
  -- Dernières métriques
  km.cpu_usage,
  km.memory_usage,
  km.network_latency,
  km.api_response_time,
  km.collected_at as last_metrics,
  
  -- Alertes actives
  (SELECT COUNT(*) FROM monitoring_alerts ma 
   WHERE ma.gym_id = g.id AND ma.status = 'active') as active_alerts,
   
  -- Incidents ouverts
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

-- Vue: Résumé alertes par sévérité
CREATE OR REPLACE VIEW v_alerts_summary AS
SELECT 
  severity,
  COUNT(*) as total_alerts,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_alerts,
  COUNT(CASE WHEN status = 'acknowledged' THEN 1 END) as acknowledged_alerts,
  MAX(triggered_at) as latest_alert
FROM monitoring_alerts
WHERE triggered_at > now() - INTERVAL '24 hours'
GROUP BY severity
ORDER BY 
  CASE severity 
    WHEN 'critical' THEN 1 
    WHEN 'error' THEN 2 
    WHEN 'warning' THEN 3 
    ELSE 4 
  END;

-- ====================================
-- ✅ VALIDATION FINALE
-- ====================================

SELECT 
  '🔧 Fonctions de monitoring créées avec succès!' as result,
  'calculate_hourly_analytics(), check_monitoring_alerts(), cleanup_monitoring_data()' as functions_created,
  'v_kiosk_current_status, v_alerts_summary' as views_created;