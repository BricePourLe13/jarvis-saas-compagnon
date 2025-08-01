-- 🔍 AUDIT DONNÉES EXISTANTES - Ce qui est RÉELLEMENT disponible
-- Analyse des données actuelles pour créer le monitoring adapté

-- ====================================
-- 🎯 1. SESSIONS JARVIS RÉELLES
-- ====================================

-- Colonnes disponibles dans jarvis_sessions
SELECT 
  '🎯 STRUCTURE jarvis_sessions' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'jarvis_sessions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Échantillon sessions récentes
SELECT 
  '📊 SESSIONS RÉCENTES' as section,
  js.id,
  js.gym_id,
  js.timestamp,
  js.session_duration,
  js.user_message_count,
  js.api_cost,
  js.conversation_context->>'model' as ai_model,
  js.conversation_context->>'total_tokens' as total_tokens,
  g.name as gym_name,
  g.kiosk_config->>'kiosk_url_slug' as kiosk_slug
FROM jarvis_sessions js
LEFT JOIN gyms g ON js.gym_id = g.id
WHERE js.timestamp > now() - INTERVAL '7 days'
ORDER BY js.timestamp DESC
LIMIT 10;

-- ====================================
-- 🎯 2. COÛTS & TOKENS RÉELS
-- ====================================

-- Analyse coûts actuels par gym
SELECT 
  '💰 COÛTS PAR GYM (7 jours)' as section,
  g.name as gym_name,
  g.kiosk_config->>'kiosk_url_slug' as kiosk_slug,
  
  -- Sessions
  COUNT(js.id) as sessions_count,
  
  -- Coûts si disponibles
  CASE WHEN SUM(js.api_cost) IS NOT NULL 
    THEN ROUND(SUM(js.api_cost)::numeric, 4)
    ELSE NULL 
  END as total_cost_usd,
  
  CASE WHEN AVG(js.api_cost) IS NOT NULL 
    THEN ROUND(AVG(js.api_cost)::numeric, 6)
    ELSE NULL 
  END as avg_cost_per_session,
  
  -- Durées
  ROUND(AVG(js.session_duration)::numeric, 0) as avg_duration_seconds,
  MAX(js.session_duration) as max_duration_seconds,
  
  -- Messages
  ROUND(AVG(js.user_message_count)::numeric, 1) as avg_messages_per_session,
  SUM(js.user_message_count) as total_messages,
  
  -- Modèles IA utilisés
  string_agg(DISTINCT js.conversation_context->>'model', ', ') as models_used,
  
  -- Tokens si disponibles
  CASE WHEN js.conversation_context->>'total_tokens' IS NOT NULL
    THEN ROUND(AVG((js.conversation_context->>'total_tokens')::integer)::numeric, 0)
    ELSE NULL
  END as avg_tokens_per_session

FROM gyms g
LEFT JOIN jarvis_sessions js ON g.id = js.gym_id 
  AND js.timestamp > now() - INTERVAL '7 days'
WHERE g.kiosk_config->>'kiosk_url_slug' IS NOT NULL
GROUP BY g.id, g.name, g.kiosk_config->>'kiosk_url_slug'
ORDER BY sessions_count DESC;

-- ====================================
-- 🎯 3. ERREURS JARVIS DISPONIBLES
-- ====================================

-- Structure table erreurs
SELECT 
  '🚨 STRUCTURE jarvis_errors_log' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'jarvis_errors_log' 
AND table_schema = 'public'
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jarvis_errors_log')
ORDER BY ordinal_position;

-- Erreurs récentes par type
SELECT 
  '🚨 ERREURS PAR TYPE (7 jours)' as section,
  jel.error_type,
  COUNT(*) as error_count,
  MIN(jel.timestamp) as first_error,
  MAX(jel.timestamp) as last_error,
  
  -- Échantillon message d'erreur
  (SELECT jel2.details 
   FROM jarvis_errors_log jel2 
   WHERE jel2.error_type = jel.error_type 
   ORDER BY jel2.timestamp DESC 
   LIMIT 1) as sample_error_details

FROM jarvis_errors_log jel
WHERE jel.timestamp > now() - INTERVAL '7 days'
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jarvis_errors_log')
GROUP BY jel.error_type
ORDER BY error_count DESC;

-- ====================================
-- 🎯 4. HEARTBEATS KIOSKS ACTUELS
-- ====================================

-- Structure heartbeats
SELECT 
  '💓 STRUCTURE kiosk_heartbeats' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'kiosk_heartbeats' 
AND table_schema = 'public'
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kiosk_heartbeats')
ORDER BY ordinal_position;

-- Status actuel kiosks
SELECT 
  '💓 STATUS KIOSKS ACTUELS' as section,
  g.name as gym_name,
  kh.kiosk_slug,
  kh.status,
  kh.last_heartbeat,
  ROUND(EXTRACT(EPOCH FROM (now() - kh.last_heartbeat))/60::numeric, 1) as minutes_ago,
  
  -- Données heartbeat disponibles
  CASE WHEN kh.metadata IS NOT NULL 
    THEN jsonb_pretty(kh.metadata)
    ELSE 'Pas de métadonnées'
  END as heartbeat_metadata

FROM gyms g
LEFT JOIN kiosk_heartbeats kh ON g.id = kh.gym_id
WHERE g.kiosk_config->>'kiosk_url_slug' IS NOT NULL
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kiosk_heartbeats')
ORDER BY kh.last_heartbeat DESC NULLS LAST;

-- ====================================
-- 🎯 5. MODÈLES IA UTILISÉS
-- ====================================

-- Analyse modèles IA des sessions
SELECT 
  '🤖 MODÈLES IA UTILISÉS' as section,
  js.conversation_context->>'model' as ai_model,
  COUNT(*) as sessions_count,
  COUNT(DISTINCT js.gym_id) as kiosks_using,
  
  -- Performance si données disponibles
  CASE WHEN AVG(js.session_duration) IS NOT NULL
    THEN ROUND(AVG(js.session_duration)::numeric, 0)
    ELSE NULL
  END as avg_duration_seconds,
  
  CASE WHEN AVG(js.api_cost) IS NOT NULL
    THEN ROUND(AVG(js.api_cost)::numeric, 6)
    ELSE NULL
  END as avg_cost_usd,
  
  -- Tokens moyens si disponibles
  CASE WHEN js.conversation_context->>'total_tokens' IS NOT NULL
    THEN ROUND(AVG((js.conversation_context->>'total_tokens')::integer)::numeric, 0)
    ELSE NULL
  END as avg_tokens,
  
  -- Utilisation temporelle
  MIN(js.timestamp) as first_used,
  MAX(js.timestamp) as last_used

FROM jarvis_sessions js
WHERE js.timestamp > now() - INTERVAL '30 days'
AND js.conversation_context->>'model' IS NOT NULL
GROUP BY js.conversation_context->>'model'
ORDER BY sessions_count DESC;

-- ====================================
-- 🎯 6. TRENDS JOURNALIERS RÉELS
-- ====================================

-- Utilisation par jour (dernières 2 semaines)
SELECT 
  '📈 TRENDS JOURNALIERS' as section,
  DATE(js.timestamp) as date,
  COUNT(js.id) as sessions_count,
  COUNT(DISTINCT js.gym_id) as active_kiosks,
  
  -- Durée moyenne
  ROUND(AVG(js.session_duration)::numeric, 0) as avg_duration_seconds,
  
  -- Coûts si disponibles
  CASE WHEN SUM(js.api_cost) IS NOT NULL
    THEN ROUND(SUM(js.api_cost)::numeric, 4)
    ELSE NULL
  END as total_cost_usd,
  
  -- Messages
  ROUND(AVG(js.user_message_count)::numeric, 1) as avg_messages_per_session,
  
  -- Modèles utilisés
  COUNT(DISTINCT js.conversation_context->>'model') as unique_models_used

FROM jarvis_sessions js
WHERE js.timestamp > now() - INTERVAL '14 days'
GROUP BY DATE(js.timestamp)
ORDER BY date DESC;

-- ====================================
-- 🎯 7. UTILISATION PAR HEURE
-- ====================================

-- Patterns d'utilisation horaire
SELECT 
  '⏰ UTILISATION PAR HEURE' as section,
  EXTRACT(HOUR FROM js.timestamp) as hour,
  COUNT(js.id) as sessions_count,
  ROUND(AVG(js.session_duration)::numeric, 0) as avg_duration_seconds,
  COUNT(DISTINCT js.gym_id) as active_kiosks,
  
  -- Coût par heure si disponible
  CASE WHEN SUM(js.api_cost) IS NOT NULL
    THEN ROUND(SUM(js.api_cost)::numeric, 4)
    ELSE NULL
  END as total_cost_usd

FROM jarvis_sessions js
WHERE js.timestamp > now() - INTERVAL '7 days'
GROUP BY EXTRACT(HOUR FROM js.timestamp)
ORDER BY hour;

-- ====================================
-- 🎯 8. KIOSKS PERFORMANCE ACTUELLE
-- ====================================

-- Classement kiosks par données réelles
SELECT 
  '🏆 PERFORMANCE KIOSKS' as section,
  g.name as gym_name,
  g.kiosk_config->>'kiosk_url_slug' as kiosk_slug,
  
  -- Volume sessions
  COUNT(js.id) as sessions_count,
  
  -- Performance sessions
  ROUND(AVG(js.session_duration)::numeric, 0) as avg_duration_seconds,
  ROUND(AVG(js.user_message_count)::numeric, 1) as avg_messages_per_session,
  
  -- Coûts
  CASE WHEN SUM(js.api_cost) IS NOT NULL
    THEN ROUND(SUM(js.api_cost)::numeric, 4)
    ELSE NULL
  END as total_cost_usd,
  
  -- Activité récente
  MAX(js.timestamp) as last_session,
  
  -- Status heartbeat si disponible
  CASE WHEN kh.last_heartbeat IS NOT NULL
    THEN ROUND(EXTRACT(EPOCH FROM (now() - kh.last_heartbeat))/60::numeric, 1)
    ELSE NULL
  END as minutes_since_heartbeat,
  
  -- Score composite basé sur données réelles
  (COUNT(js.id) * 10 + 
   CASE WHEN AVG(js.session_duration) > 60 THEN 20 ELSE 0 END +
   CASE WHEN MAX(js.timestamp) > now() - INTERVAL '24 hours' THEN 30 ELSE 0 END
  ) as performance_score

FROM gyms g
LEFT JOIN jarvis_sessions js ON g.id = js.gym_id 
  AND js.timestamp > now() - INTERVAL '7 days'
LEFT JOIN kiosk_heartbeats kh ON g.id = kh.gym_id
WHERE g.kiosk_config->>'kiosk_url_slug' IS NOT NULL
GROUP BY g.id, g.name, g.kiosk_config->>'kiosk_url_slug', kh.last_heartbeat
ORDER BY performance_score DESC;

-- ====================================
-- ✅ 9. RÉSUMÉ DONNÉES DISPONIBLES
-- ====================================

-- Ce qu'on peut monitorer MAINTENANT
SELECT 
  '✅ DONNÉES EXPLOITABLES' as section,
  
  -- Sessions
  'Sessions disponibles: ' || (SELECT COUNT(*) FROM jarvis_sessions WHERE timestamp > now() - INTERVAL '30 days') as sessions_30d,
  
  -- Coûts
  'Coûts trackés: ' || 
  CASE WHEN EXISTS (SELECT 1 FROM jarvis_sessions WHERE api_cost IS NOT NULL)
    THEN 'OUI ✅ (' || (SELECT COUNT(*) FROM jarvis_sessions WHERE api_cost IS NOT NULL AND timestamp > now() - INTERVAL '30 days') || ' sessions)'
    ELSE 'NON ❌'
  END as cost_tracking,
  
  -- Modèles IA
  'Modèles IA: ' || 
  CASE WHEN EXISTS (SELECT 1 FROM jarvis_sessions WHERE conversation_context->>'model' IS NOT NULL)
    THEN (SELECT COUNT(DISTINCT conversation_context->>'model') FROM jarvis_sessions WHERE timestamp > now() - INTERVAL '30 days')::text || ' différents ✅'
    ELSE 'NON trackés ❌'
  END as ai_models,
  
  -- Heartbeats
  'Heartbeats: ' ||
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kiosk_heartbeats')
    THEN 'Table existe ✅ (' || (SELECT COUNT(*) FROM kiosk_heartbeats WHERE last_heartbeat > now() - INTERVAL '24 hours') || ' récents)'
    ELSE 'Pas de table ❌'
  END as heartbeats_status,
  
  -- Erreurs
  'Log erreurs: ' ||
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jarvis_errors_log')
    THEN 'Table existe ✅ (' || (SELECT COUNT(*) FROM jarvis_errors_log WHERE timestamp > now() - INTERVAL '7 days') || ' erreurs 7j)'
    ELSE 'Pas de table ❌'
  END as errors_status;