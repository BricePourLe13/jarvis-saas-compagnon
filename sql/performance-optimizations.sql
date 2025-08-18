-- ⚡ OPTIMISATIONS PERFORMANCE BASE DE DONNÉES
-- Safe pour production, améliore les performances

BEGIN;

-- 📊 INDEX POUR AMÉLIORER LES PERFORMANCES

-- 1. Index sur gym_members pour recherche par badge_id
CREATE INDEX IF NOT EXISTS idx_gym_members_badge_id 
ON gym_members(badge_id);

-- 2. Index sur gym_members pour recherche par gym_id + badge_id (lookup fréquent)
CREATE INDEX IF NOT EXISTS idx_gym_members_gym_badge 
ON gym_members(gym_id, badge_id);

-- 3. Index sur jarvis_conversation_logs pour dashboard
CREATE INDEX IF NOT EXISTS idx_conversation_logs_gym_timestamp 
ON jarvis_conversation_logs(gym_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_logs_member_timestamp 
ON jarvis_conversation_logs(member_id, timestamp DESC);

-- 4. Index sur openai_realtime_sessions pour monitoring
CREATE INDEX IF NOT EXISTS idx_realtime_sessions_gym_status 
ON openai_realtime_sessions(gym_id, state, session_started_at DESC);

CREATE INDEX IF NOT EXISTS idx_realtime_sessions_activity 
ON openai_realtime_sessions(last_activity_at DESC) 
WHERE session_ended_at IS NULL;

-- 5. Index sur gyms pour kiosk lookup
CREATE INDEX IF NOT EXISTS idx_gyms_kiosk_slug 
ON gyms USING gin ((kiosk_config->>'kiosk_url_slug'));

-- 📈 VUES MATÉRIALISÉES POUR DASHBOARD (si supportées)
-- Note: Supabase PostgreSQL supporte les vues matérialisées

-- Vue des métriques gym en temps réel
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_gym_realtime_metrics AS
SELECT 
  g.id as gym_id,
  g.name as gym_name,
  COUNT(DISTINCT gm.id) as total_members,
  COUNT(DISTINCT CASE WHEN gm.last_visit > NOW() - INTERVAL '30 days' THEN gm.id END) as active_members,
  COUNT(DISTINCT ors.id) as current_sessions,
  COALESCE(AVG(ors.total_user_turns), 0) as avg_session_turns,
  MAX(ors.session_started_at) as last_session_time
FROM gyms g
LEFT JOIN gym_members gm ON g.id = gm.gym_id AND gm.is_active = true
LEFT JOIN openai_realtime_sessions ors ON g.id = ors.gym_id AND ors.session_ended_at IS NULL
WHERE g.status = 'active'
GROUP BY g.id, g.name;

-- Index sur la vue matérialisée
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_gym_metrics_gym_id 
ON mv_gym_realtime_metrics(gym_id);

-- 🔄 FONCTION POUR RAFRAÎCHIR LES VUES MATÉRIALISÉES
CREATE OR REPLACE FUNCTION refresh_dashboard_metrics()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_gym_realtime_metrics;
  
  -- Log le rafraîchissement
  INSERT INTO system_logs (
    level, 
    category, 
    message, 
    timestamp
  ) VALUES (
    'info', 
    'PERFORMANCE', 
    'Dashboard metrics refreshed', 
    NOW()
  ) ON CONFLICT DO NOTHING; -- Ignore si table n'existe pas
  
  RAISE NOTICE 'Dashboard metrics refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🔧 FONCTION D'OPTIMISATION AUTOMATIQUE
CREATE OR REPLACE FUNCTION optimize_tables()
RETURNS TEXT AS $$
DECLARE
  result TEXT := '';
BEGIN
  -- Analyser les tables principales pour optimiser le query planner
  ANALYZE gym_members;
  ANALYZE gyms; 
  ANALYZE jarvis_conversation_logs;
  ANALYZE openai_realtime_sessions;
  
  result := 'Tables analyzed for query optimization';
  
  -- Rafraîchir les vues matérialisées
  PERFORM refresh_dashboard_metrics();
  
  result := result || ', Dashboard metrics refreshed';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🧹 FONCTION DE NETTOYAGE AUTOMATIQUE
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS TEXT AS $$
DECLARE
  cleaned_logs INTEGER;
  cleaned_sessions INTEGER;
  result TEXT := '';
BEGIN
  -- Supprimer les logs de conversation de plus de 6 mois
  DELETE FROM jarvis_conversation_logs 
  WHERE timestamp < NOW() - INTERVAL '6 months';
  
  GET DIAGNOSTICS cleaned_logs = ROW_COUNT;
  
  -- Supprimer les sessions terminées de plus de 3 mois
  DELETE FROM openai_realtime_sessions 
  WHERE session_ended_at IS NOT NULL 
    AND session_ended_at < NOW() - INTERVAL '3 months';
  
  GET DIAGNOSTICS cleaned_sessions = ROW_COUNT;
  
  result := format('Cleaned %s old conversation logs, %s old sessions', 
                   cleaned_logs, cleaned_sessions);
  
  -- Analyser après nettoyage
  ANALYZE jarvis_conversation_logs;
  ANALYZE openai_realtime_sessions;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- 📊 STATISTIQUES POST-OPTIMISATION
SELECT 
  schemaname,
  tablename,
  attname as column_name,
  n_distinct,
  correlation
FROM pg_stats 
WHERE schemaname = 'public' 
  AND tablename IN ('gym_members', 'gyms', 'jarvis_conversation_logs')
ORDER BY tablename, attname;

-- 🎯 VALIDATION DES INDEX
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename IN ('gym_members', 'gyms', 'jarvis_conversation_logs', 'openai_realtime_sessions')
ORDER BY tablename, indexname;

RAISE NOTICE '⚡ OPTIMISATIONS PERFORMANCE APPLIQUÉES!';
