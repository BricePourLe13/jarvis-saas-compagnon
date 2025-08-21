-- 🔧 MISSING RPCs POUR DASHBOARD
-- Fonctions manquantes identifiées

-- 1. get_kiosk_realtime_metrics
CREATE OR REPLACE FUNCTION get_kiosk_realtime_metrics()
RETURNS TABLE (
  total_active_sessions bigint,
  total_cost_today numeric,
  sessions_today bigint,
  avg_session_duration numeric,
  success_rate numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM v_openai_realtime_active_sessions_v2) as total_active_sessions,
    (SELECT COALESCE(SUM(total_cost), 0) FROM v_costs_today) as total_cost_today,
    (SELECT COUNT(*) FROM v_sessions_today) as sessions_today,
    (SELECT COALESCE(AVG(session_duration_seconds), 0) 
     FROM openai_realtime_sessions 
     WHERE session_started_at >= CURRENT_DATE) as avg_session_duration,
    (SELECT CASE 
       WHEN COUNT(*) = 0 THEN 100.0
       ELSE (COUNT(CASE WHEN session_ended_at IS NOT NULL THEN 1 END) * 100.0 / COUNT(*))
     END
     FROM openai_realtime_sessions 
     WHERE session_started_at >= CURRENT_DATE) as success_rate;
END;
$$;

-- 2. cleanup_inactive_realtime_sessions  
CREATE OR REPLACE FUNCTION cleanup_inactive_realtime_sessions()
RETURNS TABLE (
  cleaned_sessions bigint,
  total_duration_recovered numeric
)
LANGUAGE plpgsql  
SECURITY DEFINER
AS $$
DECLARE
  v_cleaned_count bigint := 0;
  v_total_duration numeric := 0;
BEGIN
  -- Nettoyer les sessions inactives depuis plus de 30 minutes
  WITH inactive_sessions AS (
    UPDATE openai_realtime_sessions
    SET 
      session_ended_at = COALESCE(session_ended_at, NOW()),
      session_duration_seconds = COALESCE(session_duration_seconds, 
        EXTRACT(EPOCH FROM (NOW() - session_started_at))::integer),
      end_reason = COALESCE(end_reason, 'timeout_cleanup'),
      state = 'closed'
    WHERE 
      session_ended_at IS NULL 
      AND session_started_at < NOW() - INTERVAL '30 minutes'
    RETURNING session_duration_seconds
  )
  SELECT 
    COUNT(*), 
    COALESCE(SUM(session_duration_seconds), 0)
  INTO v_cleaned_count, v_total_duration
  FROM inactive_sessions;
  
  RETURN QUERY SELECT v_cleaned_count, v_total_duration;
END;
$$;

-- 3. GRANTS
GRANT EXECUTE ON FUNCTION get_kiosk_realtime_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_inactive_realtime_sessions() TO authenticated;
