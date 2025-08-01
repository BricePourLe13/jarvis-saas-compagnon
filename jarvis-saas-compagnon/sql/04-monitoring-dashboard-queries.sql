-- 📊 REQUÊTES OPTIMISÉES POUR DASHBOARD MONITORING JARVIS
-- Queries prêtes à utiliser dans l'interface admin

-- ====================================
-- 🎯 REQUÊTE: Vue d'ensemble monitoring
-- ====================================

-- Métriques globales dernières 24h
WITH monitoring_overview AS (
  SELECT 
    COUNT(DISTINCT g.id) as total_kiosks,
    COUNT(DISTINCT CASE WHEN kh.last_heartbeat > now() - INTERVAL '2 minutes' THEN g.id END) as online_kiosks,
    COUNT(DISTINCT ma.gym_id) as kiosks_with_alerts,
    COUNT(DISTINCT ki.gym_id) as kiosks_with_incidents,
    
    -- Moyennes globales
    AVG(km.cpu_usage) as avg_cpu_usage,
    AVG(km.memory_usage) as avg_memory_usage,
    AVG(km.network_latency) as avg_network_latency,
    AVG(km.api_response_time) as avg_api_response_time,
    
    -- Compteurs erreurs
    COUNT(DISTINCT ma.id) as total_active_alerts,
    COUNT(DISTINCT CASE WHEN ma.severity = 'critical' THEN ma.id END) as critical_alerts,
    COUNT(DISTINCT CASE WHEN ki.status IN ('open', 'investigating') THEN ki.id END) as open_incidents
    
  FROM gyms g
  LEFT JOIN kiosk_heartbeats kh ON g.id = kh.gym_id
  LEFT JOIN monitoring_alerts ma ON g.id = ma.gym_id AND ma.status = 'active'
  LEFT JOIN kiosk_incidents ki ON g.id = ki.gym_id AND ki.status IN ('open', 'investigating')
  LEFT JOIN kiosk_metrics km ON g.id = km.gym_id AND km.collected_at > now() - INTERVAL '1 hour'
  WHERE g.kiosk_config->>'kiosk_url_slug' IS NOT NULL
)
SELECT 
  total_kiosks,
  online_kiosks,
  (online_kiosks * 100.0 / NULLIF(total_kiosks, 0))::DECIMAL(5,2) as uptime_percentage,
  
  kiosks_with_alerts,
  kiosks_with_incidents,
  
  avg_cpu_usage::DECIMAL(5,2),
  avg_memory_usage::DECIMAL(5,2),
  avg_network_latency::INTEGER,
  avg_api_response_time::INTEGER,
  
  total_active_alerts,
  critical_alerts,
  open_incidents,
  
  now() as calculated_at
FROM monitoring_overview;

-- ====================================
-- 🚨 REQUÊTE: Top alertes critiques
-- ====================================

SELECT 
  ma.id,
  ma.gym_id,
  g.name as gym_name,
  f.name as franchise_name,
  ma.kiosk_slug,
  ma.alert_type,
  ma.severity,
  ma.title,
  ma.description,
  ma.current_value,
  ma.threshold_value,
  ma.unit,
  ma.recommended_action,
  ma.triggered_at,
  EXTRACT(EPOCH FROM (now() - ma.triggered_at))/60 as minutes_active,
  ma.status
FROM monitoring_alerts ma
JOIN gyms g ON ma.gym_id = g.id
JOIN franchises f ON g.franchise_id = f.id
WHERE ma.status = 'active'
AND ma.severity IN ('critical', 'error')
ORDER BY 
  CASE ma.severity 
    WHEN 'critical' THEN 1 
    WHEN 'error' THEN 2 
    ELSE 3 
  END,
  ma.triggered_at DESC
LIMIT 10;

-- ====================================
-- 📈 REQUÊTE: Performance trends (24h)
-- ====================================

SELECT 
  date_trunc('hour', kah.hour_bucket) as hour,
  AVG(kah.avg_cpu_usage)::DECIMAL(5,2) as avg_cpu,
  AVG(kah.avg_memory_usage)::DECIMAL(5,2) as avg_memory,
  AVG(kah.avg_network_latency)::INTEGER as avg_latency,
  SUM(kah.total_sessions) as total_sessions,
  AVG(kah.success_rate)::DECIMAL(5,2) as avg_success_rate,
  AVG(kah.error_rate)::DECIMAL(5,2) as avg_error_rate,
  AVG(kah.uptime_percentage)::DECIMAL(5,2) as avg_uptime
FROM kiosk_analytics_hourly kah
WHERE kah.hour_bucket > now() - INTERVAL '24 hours'
GROUP BY date_trunc('hour', kah.hour_bucket)
ORDER BY hour DESC;

-- ====================================
-- 🔍 REQUÊTE: Détail kiosk spécifique
-- ====================================

-- Utiliser avec paramètre gym_id
SELECT 
  -- Infos de base
  g.id as gym_id,
  g.name as gym_name,
  f.name as franchise_name,
  g.kiosk_config->>'kiosk_url_slug' as kiosk_slug,
  g.status as gym_status,
  
  -- Statut en temps réel
  CASE 
    WHEN kh.last_heartbeat > now() - INTERVAL '2 minutes' 
    THEN 'online'
    ELSE 'offline'
  END as online_status,
  kh.last_heartbeat,
  EXTRACT(EPOCH FROM (now() - kh.last_heartbeat))/60 as minutes_since_heartbeat,
  
  -- Dernières métriques (dans les 10 dernières minutes)
  km.cpu_usage,
  km.memory_usage,
  km.memory_used,
  km.memory_total,
  km.storage_usage,
  km.network_latency,
  km.download_speed,
  km.upload_speed,
  km.network_quality,
  km.api_response_time,
  km.microphone_level,
  km.speaker_volume,
  km.audio_quality,
  km.temperature_cpu,
  km.power_consumption,
  km.collected_at as last_metrics_time,
  
  -- Statistiques session aujourd'hui
  (SELECT COUNT(*) FROM jarvis_sessions js 
   WHERE js.gym_id = g.id 
   AND js.timestamp::date = CURRENT_DATE) as sessions_today,
   
  (SELECT AVG(js.session_duration)::INTEGER FROM jarvis_sessions js 
   WHERE js.gym_id = g.id 
   AND js.timestamp::date = CURRENT_DATE) as avg_duration_today,
   
  -- Alertes actives
  (SELECT COUNT(*) FROM monitoring_alerts ma 
   WHERE ma.gym_id = g.id AND ma.status = 'active') as active_alerts,
   
  (SELECT COUNT(*) FROM monitoring_alerts ma 
   WHERE ma.gym_id = g.id AND ma.status = 'active' 
   AND ma.severity = 'critical') as critical_alerts,
   
  -- Incidents ouverts
  (SELECT COUNT(*) FROM kiosk_incidents ki 
   WHERE ki.gym_id = g.id 
   AND ki.status IN ('open', 'investigating')) as open_incidents,
   
  -- Dernière erreur
  (SELECT jel.error_type FROM jarvis_errors_log jel 
   WHERE jel.gym_slug = g.kiosk_config->>'kiosk_url_slug' 
   ORDER BY jel.timestamp DESC LIMIT 1) as last_error_type,
   
  (SELECT jel.timestamp FROM jarvis_errors_log jel 
   WHERE jel.gym_slug = g.kiosk_config->>'kiosk_url_slug' 
   ORDER BY jel.timestamp DESC LIMIT 1) as last_error_time

FROM gyms g
LEFT JOIN franchises f ON g.franchise_id = f.id
LEFT JOIN kiosk_heartbeats kh ON g.id = kh.gym_id
LEFT JOIN LATERAL (
  SELECT * FROM kiosk_metrics km2 
  WHERE km2.gym_id = g.id 
  ORDER BY km2.collected_at DESC 
  LIMIT 1
) km ON true
WHERE g.id = $1 -- Paramètre gym_id
AND g.kiosk_config->>'kiosk_url_slug' IS NOT NULL;

-- ====================================
-- 🔧 REQUÊTE: Health check complet
-- ====================================

WITH health_metrics AS (
  SELECT 
    g.id as gym_id,
    g.name as gym_name,
    g.kiosk_config->>'kiosk_url_slug' as kiosk_slug,
    
    -- Statut heartbeat
    CASE 
      WHEN kh.last_heartbeat > now() - INTERVAL '2 minutes' THEN 'healthy'
      WHEN kh.last_heartbeat > now() - INTERVAL '10 minutes' THEN 'degraded'
      ELSE 'unhealthy'
    END as heartbeat_status,
    
    -- Métriques système
    CASE 
      WHEN km.cpu_usage IS NULL THEN 'unknown'
      WHEN km.cpu_usage < 70 THEN 'healthy'
      WHEN km.cpu_usage < 85 THEN 'degraded'
      ELSE 'unhealthy'
    END as cpu_status,
    
    CASE 
      WHEN km.memory_usage IS NULL THEN 'unknown'
      WHEN km.memory_usage < 80 THEN 'healthy'
      WHEN km.memory_usage < 90 THEN 'degraded'
      ELSE 'unhealthy'
    END as memory_status,
    
    CASE 
      WHEN km.network_latency IS NULL THEN 'unknown'
      WHEN km.network_latency < 200 THEN 'healthy'
      WHEN km.network_latency < 500 THEN 'degraded'
      ELSE 'unhealthy'
    END as network_status,
    
    CASE 
      WHEN km.api_response_time IS NULL THEN 'unknown'
      WHEN km.api_response_time < 2000 THEN 'healthy'
      WHEN km.api_response_time < 3000 THEN 'degraded'
      ELSE 'unhealthy'
    END as api_status,
    
    -- Alertes et incidents
    CASE 
      WHEN (SELECT COUNT(*) FROM monitoring_alerts ma 
            WHERE ma.gym_id = g.id AND ma.status = 'active' 
            AND ma.severity = 'critical') > 0 THEN 'unhealthy'
      WHEN (SELECT COUNT(*) FROM monitoring_alerts ma 
            WHERE ma.gym_id = g.id AND ma.status = 'active' 
            AND ma.severity = 'error') > 0 THEN 'degraded'
      ELSE 'healthy'
    END as alerts_status,
    
    km.collected_at,
    kh.last_heartbeat
    
  FROM gyms g
  LEFT JOIN kiosk_heartbeats kh ON g.id = kh.gym_id
  LEFT JOIN LATERAL (
    SELECT * FROM kiosk_metrics km2 
    WHERE km2.gym_id = g.id 
    ORDER BY km2.collected_at DESC 
    LIMIT 1
  ) km ON true
  WHERE g.kiosk_config->>'kiosk_url_slug' IS NOT NULL
)
SELECT 
  gym_id,
  gym_name,
  kiosk_slug,
  
  -- Statut global
  CASE 
    WHEN 'unhealthy' = ANY(ARRAY[heartbeat_status, cpu_status, memory_status, network_status, api_status, alerts_status]) 
    THEN 'unhealthy'
    WHEN 'degraded' = ANY(ARRAY[heartbeat_status, cpu_status, memory_status, network_status, api_status, alerts_status]) 
    THEN 'degraded'
    ELSE 'healthy'
  END as overall_status,
  
  -- Détail par composant
  heartbeat_status,
  cpu_status,
  memory_status,
  network_status,
  api_status,
  alerts_status,
  
  collected_at,
  last_heartbeat,
  
  now() as checked_at
  
FROM health_metrics
ORDER BY 
  CASE 
    WHEN 'unhealthy' = ANY(ARRAY[heartbeat_status, cpu_status, memory_status, network_status, api_status, alerts_status]) THEN 1
    WHEN 'degraded' = ANY(ARRAY[heartbeat_status, cpu_status, memory_status, network_status, api_status, alerts_status]) THEN 2
    ELSE 3
  END,
  gym_name;

-- ====================================
-- 📊 REQUÊTE: Top erreurs par type (7 jours)
-- ====================================

SELECT 
  jel.error_type,
  COUNT(*) as error_count,
  COUNT(DISTINCT jel.gym_slug) as affected_kiosks,
  COUNT(CASE WHEN jel.resolved THEN 1 END) as resolved_count,
  
  -- Pourcentage résolu
  (COUNT(CASE WHEN jel.resolved THEN 1 END) * 100.0 / COUNT(*))::DECIMAL(5,2) as resolution_rate,
  
  MAX(jel.timestamp) as last_occurrence,
  MIN(jel.timestamp) as first_occurrence,
  
  -- Échantillon de détails
  (SELECT jel2.error_details FROM jarvis_errors_log jel2 
   WHERE jel2.error_type = jel.error_type 
   ORDER BY jel2.timestamp DESC LIMIT 1) as sample_details

FROM jarvis_errors_log jel
WHERE jel.timestamp > now() - INTERVAL '7 days'
GROUP BY jel.error_type
ORDER BY error_count DESC
LIMIT 15;

-- ====================================
-- ⚡ REQUÊTE: Sessions performance aujourd'hui
-- ====================================

SELECT 
  g.name as gym_name,
  COUNT(js.id) as total_sessions,
  
  -- Performance temps de réponse
  AVG(js.session_duration)::INTEGER as avg_duration_seconds,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY js.session_duration) as median_duration,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY js.session_duration) as p95_duration,
  
  -- Qualité sessions
  COUNT(CASE WHEN js.session_duration >= 30 THEN 1 END) as good_sessions,
  COUNT(CASE WHEN js.session_duration < 10 THEN 1 END) as failed_sessions,
  
  -- Taux de succès
  (COUNT(CASE WHEN js.session_duration >= 30 THEN 1 END) * 100.0 / COUNT(*))::DECIMAL(5,2) as success_rate,
  
  -- Analyse sentiment (si disponible)
  AVG(js.sentiment_score)::DECIMAL(3,2) as avg_sentiment,
  AVG(js.satisfaction_rating)::DECIMAL(3,2) as avg_satisfaction,
  
  -- Timeline
  MIN(js.timestamp) as first_session,
  MAX(js.timestamp) as last_session

FROM jarvis_sessions js
JOIN gyms g ON js.gym_id = g.id
WHERE js.timestamp::date = CURRENT_DATE
GROUP BY g.id, g.name
HAVING COUNT(js.id) > 0
ORDER BY total_sessions DESC;

-- ====================================
-- 🎯 REQUÊTE: Recommandations maintenance
-- ====================================

WITH maintenance_needs AS (
  SELECT 
    g.id,
    g.name as gym_name,
    g.kiosk_config->>'kiosk_url_slug' as kiosk_slug,
    
    -- Critères maintenance
    CASE WHEN km.cpu_usage > 80 THEN 'Optimisation CPU requise' END as cpu_issue,
    CASE WHEN km.memory_usage > 85 THEN 'Nettoyage mémoire requis' END as memory_issue,
    CASE WHEN km.storage_usage > 90 THEN 'Espace disque critique' END as storage_issue,
    CASE WHEN km.temperature_cpu > 75 THEN 'Vérification ventilation' END as thermal_issue,
    CASE WHEN km.network_latency > 300 THEN 'Diagnostic réseau requis' END as network_issue,
    CASE WHEN km.api_response_time > 2500 THEN 'Problème connectivité API' END as api_issue,
    
    -- Dernière maintenance
    (SELECT MAX(ki.resolved_at) FROM kiosk_incidents ki 
     WHERE ki.gym_id = g.id AND ki.status = 'resolved') as last_maintenance,
     
    -- Uptime récent
    (SELECT AVG(kah.uptime_percentage) FROM kiosk_analytics_hourly kah 
     WHERE kah.gym_id = g.id 
     AND kah.hour_bucket > now() - INTERVAL '7 days') as avg_uptime_7d,
     
    km.collected_at
    
  FROM gyms g
  LEFT JOIN LATERAL (
    SELECT * FROM kiosk_metrics km2 
    WHERE km2.gym_id = g.id 
    ORDER BY km2.collected_at DESC 
    LIMIT 1
  ) km ON true
  WHERE g.kiosk_config->>'kiosk_url_slug' IS NOT NULL
)
SELECT 
  gym_name,
  kiosk_slug,
  
  -- Problèmes détectés
  ARRAY_REMOVE(ARRAY[cpu_issue, memory_issue, storage_issue, thermal_issue, network_issue, api_issue], NULL) as issues,
  
  -- Priorité maintenance
  CASE 
    WHEN storage_issue IS NOT NULL OR thermal_issue IS NOT NULL THEN 'HIGH'
    WHEN memory_issue IS NOT NULL OR api_issue IS NOT NULL THEN 'MEDIUM'
    WHEN cpu_issue IS NOT NULL OR network_issue IS NOT NULL THEN 'LOW'
    ELSE 'OK'
  END as maintenance_priority,
  
  -- Dernière maintenance
  COALESCE(last_maintenance, 'Jamais') as last_maintenance,
  CASE 
    WHEN last_maintenance IS NULL THEN 'Maintenance recommandée'
    WHEN last_maintenance < now() - INTERVAL '30 days' THEN 'Maintenance en retard'
    ELSE 'OK'
  END as maintenance_status,
  
  avg_uptime_7d::DECIMAL(5,2) as uptime_7_days,
  collected_at as last_check

FROM maintenance_needs
WHERE 
  -- Afficher seulement ceux nécessitant attention
  (cpu_issue IS NOT NULL OR memory_issue IS NOT NULL OR storage_issue IS NOT NULL 
   OR thermal_issue IS NOT NULL OR network_issue IS NOT NULL OR api_issue IS NOT NULL)
  OR last_maintenance IS NULL 
  OR last_maintenance < now() - INTERVAL '30 days'
  OR avg_uptime_7d < 95
ORDER BY 
  CASE maintenance_priority 
    WHEN 'HIGH' THEN 1 
    WHEN 'MEDIUM' THEN 2 
    WHEN 'LOW' THEN 3 
    ELSE 4 
  END,
  gym_name;