-- 🔍 AUDIT RAPIDE - Configuration JARVIS actuelle
-- Script simplifié pour analyser ton setup

-- ====================================
-- 📊 TABLES EXISTANTES
-- ====================================
SELECT 
  '📊 TABLES EXISTANTES' as section,
  table_name,
  CASE 
    WHEN table_name = 'gyms' THEN '✅ Core'
    WHEN table_name = 'jarvis_sessions' THEN '✅ Sessions'
    WHEN table_name = 'kiosk_heartbeats' THEN '💓 Heartbeats'
    WHEN table_name = 'jarvis_errors_log' THEN '🚨 Erreurs'
    WHEN table_name LIKE 'kiosk_%' THEN '📊 Monitoring'
    ELSE '📝 Autre'
  END as type
FROM information_schema.tables 
WHERE schemaname = 'public' 
AND table_name IN (
  'gyms', 'jarvis_sessions', 'kiosk_heartbeats', 'jarvis_errors_log',
  'kiosk_metrics', 'kiosk_incidents', 'kiosk_analytics_hourly', 'monitoring_alerts'
)
ORDER BY table_name;

-- ====================================
-- 📈 COMPTAGE DONNÉES
-- ====================================
SELECT '📈 DONNÉES ACTUELLES' as section, 'gyms' as table_name, COUNT(*) as records FROM gyms
UNION ALL
SELECT '📈 DONNÉES ACTUELLES', 'jarvis_sessions', COUNT(*) FROM jarvis_sessions
UNION ALL
SELECT '📈 DONNÉES ACTUELLES', 'kiosk_heartbeats', 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kiosk_heartbeats') 
  THEN (SELECT COUNT(*)::text FROM kiosk_heartbeats)::bigint
  ELSE 0 END
UNION ALL
SELECT '📈 DONNÉES ACTUELLES', 'jarvis_errors_log', 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jarvis_errors_log') 
  THEN (SELECT COUNT(*)::text FROM jarvis_errors_log)::bigint
  ELSE 0 END
UNION ALL
SELECT '📈 DONNÉES ACTUELLES', 'kiosk_metrics', 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kiosk_metrics') 
  THEN (SELECT COUNT(*)::text FROM kiosk_metrics)::bigint
  ELSE 0 END
ORDER BY table_name;

-- ====================================
-- 🏪 KIOSKS CONFIGURÉS
-- ====================================
SELECT 
  '🏪 KIOSKS CONFIGURÉS' as section,
  g.name as gym_name,
  g.city,
  g.status,
  g.kiosk_config->>'kiosk_url_slug' as kiosk_slug,
  g.kiosk_config->>'is_provisioned' as is_provisioned,
  CASE 
    WHEN g.kiosk_config->>'kiosk_url_slug' IS NOT NULL THEN '✅ Configuré'
    ELSE '❌ Non configuré'
  END as kiosk_status
FROM gyms g
ORDER BY g.created_at DESC;

-- ====================================
-- 💓 HEARTBEATS RÉCENTS (si table existe)
-- ====================================
SELECT 
  '💓 HEARTBEATS RÉCENTS' as section,
  kh.kiosk_slug,
  kh.status,
  kh.last_heartbeat,
  EXTRACT(EPOCH FROM (now() - kh.last_heartbeat))/60 as minutes_ago,
  g.name as gym_name
FROM kiosk_heartbeats kh
LEFT JOIN gyms g ON kh.gym_id = g.id
WHERE kh.last_heartbeat > now() - INTERVAL '24 hours'
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kiosk_heartbeats')
ORDER BY kh.last_heartbeat DESC
LIMIT 10;

-- ====================================
-- 🚨 ERREURS RÉCENTES (si table existe)
-- ====================================
SELECT 
  '🚨 ERREURS RÉCENTES' as section,
  jel.error_type,
  COUNT(*) as error_count,
  MAX(jel.timestamp) as last_error
FROM jarvis_errors_log jel
WHERE jel.timestamp > now() - INTERVAL '7 days'
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jarvis_errors_log')
GROUP BY jel.error_type
ORDER BY error_count DESC
LIMIT 10;

-- ====================================
-- 📊 SESSIONS AUJOURD'HUI
-- ====================================
SELECT 
  '📊 SESSIONS AUJOURD''HUI' as section,
  g.name as gym_name,
  COUNT(js.id) as sessions_count,
  AVG(js.session_duration)::INTEGER as avg_duration_seconds,
  MIN(js.timestamp) as first_session,
  MAX(js.timestamp) as last_session
FROM jarvis_sessions js
JOIN gyms g ON js.gym_id = g.id
WHERE js.timestamp::date = CURRENT_DATE
GROUP BY g.id, g.name
ORDER BY sessions_count DESC;

-- ====================================
-- 📊 MÉTRIQUES MONITORING (si disponibles)
-- ====================================
SELECT 
  '📊 MÉTRIQUES RÉCENTES' as section,
  km.kiosk_slug,
  km.cpu_usage || '%' as cpu,
  km.memory_usage || '%' as memory,
  km.network_latency || 'ms' as latency,
  km.api_response_time || 'ms' as api_time,
  km.collected_at
FROM kiosk_metrics km
WHERE km.collected_at > now() - INTERVAL '1 hour'
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kiosk_metrics')
ORDER BY km.collected_at DESC
LIMIT 10;

-- ====================================
-- ✅ RÉSUMÉ FINAL
-- ====================================
SELECT 
  '✅ RÉSUMÉ AUDIT' as section,
  'Installation monitoring: ' || 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kiosk_metrics') 
  THEN 'COMPLÈTE ✅' 
  ELSE 'EN COURS ⏳' END as monitoring_status,
  'Kiosks configurés: ' || (SELECT COUNT(*) FROM gyms WHERE kiosk_config->>'kiosk_url_slug' IS NOT NULL) as kiosks_ready,
  'Sessions aujourd''hui: ' || (SELECT COUNT(*) FROM jarvis_sessions WHERE timestamp::date = CURRENT_DATE) as sessions_today,
  now() as audit_time;