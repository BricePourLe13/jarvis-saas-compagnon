-- 🔍 AUDIT COMPLET DE LA CONFIGURATION SUPABASE EXISTANTE
-- Script à exécuter pour analyser l'état actuel de ta base

-- ====================================
-- 📊 ANALYSE DES TABLES EXISTANTES
-- ====================================

-- Vérifier quelles tables existent
SELECT 
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('gyms', 'jarvis_sessions', 'kiosk_heartbeats', 'jarvis_errors_log', 'franchises', 'users')
ORDER BY tablename;

-- ====================================
-- 📈 STATISTIQUES DES DONNÉES
-- ====================================

-- Compter les enregistrements par table
SELECT 'franchises' as table_name, COUNT(*) as records FROM franchises
UNION ALL
SELECT 'gyms', COUNT(*) FROM gyms
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'jarvis_sessions', COUNT(*) FROM jarvis_sessions
UNION ALL
SELECT 'kiosk_heartbeats', COUNT(*) FROM kiosk_heartbeats WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kiosk_heartbeats')
UNION ALL
SELECT 'jarvis_errors_log', COUNT(*) FROM jarvis_errors_log WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jarvis_errors_log')
ORDER BY table_name;

-- ====================================
-- 🔧 VÉRIFIER LA STRUCTURE DES KIOSKS
-- ====================================

-- Analyser la configuration des kiosks existants
SELECT 
  g.id,
  g.name as gym_name,
  g.city,
  g.status as gym_status,
  f.name as franchise_name,
  g.kiosk_config->>'kiosk_url_slug' as kiosk_slug,
  g.kiosk_config->>'is_provisioned' as is_provisioned,
  g.kiosk_config->>'last_heartbeat' as last_heartbeat_config,
  g.created_at
FROM gyms g
LEFT JOIN franchises f ON g.franchise_id = f.id
ORDER BY g.created_at DESC;

-- ====================================
-- 💓 STATUT HEARTBEATS (si table existe)
-- ====================================

-- Vérifier les heartbeats récents
DO $$
DECLARE
  heartbeat_count INTEGER;
  latest_heartbeat TIMESTAMP WITH TIME ZONE;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kiosk_heartbeats') THEN
    RAISE NOTICE 'Table kiosk_heartbeats existe - Analyse...';
    
    -- Compter les heartbeats des dernières 24h
    SELECT COUNT(*), MAX(last_heartbeat) 
    INTO heartbeat_count, latest_heartbeat
    FROM kiosk_heartbeats kh
    WHERE kh.last_heartbeat > now() - INTERVAL '24 hours';
    
    RAISE NOTICE 'Heartbeats dernières 24h: % | Dernier: %', heartbeat_count, latest_heartbeat;
    
    -- Afficher détails si il y en a
    IF heartbeat_count > 0 THEN
      RAISE NOTICE 'Utilisez cette requête pour voir les détails:';
      RAISE NOTICE 'SELECT kh.gym_id, kh.kiosk_slug, kh.status, kh.last_heartbeat, g.name FROM kiosk_heartbeats kh LEFT JOIN gyms g ON kh.gym_id = g.id WHERE kh.last_heartbeat > now() - INTERVAL ''24 hours'' ORDER BY kh.last_heartbeat DESC;';
    END IF;
  ELSE
    RAISE NOTICE 'Table kiosk_heartbeats n''existe pas encore';
  END IF;
END $$;

-- ====================================
-- 🚨 ANALYSE DES ERREURS (si table existe)
-- ====================================

DO $$
DECLARE
  error_count INTEGER;
  error_types TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jarvis_errors_log') THEN
    RAISE NOTICE 'Table jarvis_errors_log existe - Analyse...';
    
    -- Compter les erreurs des 7 derniers jours
    SELECT COUNT(*) INTO error_count
    FROM jarvis_errors_log
    WHERE timestamp > now() - INTERVAL '7 days';
    
    RAISE NOTICE 'Erreurs derniers 7 jours: %', error_count;
    
    -- Afficher les types d'erreurs si il y en a
    IF error_count > 0 THEN
      RAISE NOTICE 'Utilisez cette requête pour voir les détails:';
      RAISE NOTICE 'SELECT error_type, COUNT(*) as count, MAX(timestamp) as last_error FROM jarvis_errors_log WHERE timestamp > now() - INTERVAL ''7 days'' GROUP BY error_type ORDER BY count DESC;';
    END IF;
  ELSE
    RAISE NOTICE 'Table jarvis_errors_log n''existe pas encore';
  END IF;
END $$;

-- ====================================
-- 📊 SESSIONS JARVIS RÉCENTES
-- ====================================

-- Analyser les sessions des 7 derniers jours
SELECT 
  DATE(js.timestamp) as session_date,
  COUNT(*) as total_sessions,
  AVG(js.session_duration) as avg_duration_seconds,
  COUNT(DISTINCT js.gym_id) as active_gyms,
  COUNT(DISTINCT js.member_badge_id) as unique_members,
  MIN(js.timestamp) as first_session,
  MAX(js.timestamp) as last_session
FROM jarvis_sessions js
WHERE js.timestamp > now() - INTERVAL '7 days'
GROUP BY DATE(js.timestamp)
ORDER BY session_date DESC;

-- ====================================
-- 🔍 PERFORMANCES & INDEXES
-- ====================================

-- Vérifier les indexes existants
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('gyms', 'jarvis_sessions', 'kiosk_heartbeats', 'jarvis_errors_log')
ORDER BY tablename, indexname;

-- ====================================
-- ⚡ RECOMMANDATIONS
-- ====================================

-- Taille des tables
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('gyms', 'jarvis_sessions', 'kiosk_heartbeats', 'jarvis_errors_log', 'franchises', 'users')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ====================================
-- 📋 RÉSUMÉ FINAL
-- ====================================

SELECT 
  '🔍 AUDIT TERMINÉ' as status,
  now() as audit_timestamp,
  'Vérifiez les résultats ci-dessus pour configuration monitoring' as next_steps;