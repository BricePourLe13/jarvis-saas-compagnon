-- 🔍 DIAGNOSTIC MONITORING OPENAI REALTIME
-- Script pour diagnostiquer pourquoi les données ne remontent pas

-- 1. Vérifier si les tables existent
SELECT 
    schemaname, 
    tablename, 
    hasindexes, 
    hasrules, 
    hastriggers
FROM pg_tables 
WHERE tablename LIKE 'openai_realtime%'
ORDER BY tablename;

-- 2. Compter les enregistrements dans chaque table
SELECT 'openai_realtime_sessions' as table_name, COUNT(*) as count FROM openai_realtime_sessions
UNION ALL
SELECT 'openai_realtime_audio_events' as table_name, COUNT(*) as count FROM openai_realtime_audio_events
UNION ALL
SELECT 'openai_realtime_webrtc_stats' as table_name, COUNT(*) as count FROM openai_realtime_webrtc_stats
UNION ALL
SELECT 'openai_realtime_cost_tracking' as table_name, COUNT(*) as count FROM openai_realtime_cost_tracking;

-- 3. Vérifier les vues
SELECT 
    schemaname, 
    viewname, 
    definition
FROM pg_views 
WHERE viewname LIKE 'v_openai_realtime%'
ORDER BY viewname;

-- 4. Vérifier les sessions récentes (si il y en a)
SELECT 
    session_id,
    gym_id,
    kiosk_slug,
    session_started_at,
    session_ended_at,
    total_cost_usd,
    total_user_turns,
    total_ai_turns
FROM openai_realtime_sessions
ORDER BY session_started_at DESC
LIMIT 5;

-- 5. Tester la vue v_openai_realtime_kiosk_stats_24h
SELECT 
    gym_id,
    gym_name,
    kiosk_slug,
    sessions_24h,
    active_sessions,
    total_cost_24h_usd
FROM v_openai_realtime_kiosk_stats_24h
LIMIT 5;

-- 6. Vérifier les fonctions d'instrumentation
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname LIKE '%session%turns%'
   OR proname LIKE 'get_gym_active_sessions'
   OR proname LIKE 'get_kiosk_realtime_metrics';

-- 7. Test rapide de la fonction get_kiosk_realtime_metrics
-- (remplace 'YOUR_GYM_ID' par un vrai gym_id)
SELECT 
    id, 
    name as gym_name 
FROM gyms 
LIMIT 3;

SELECT '🔍 DIAGNOSTIC COMPLET - Vérifiez les résultats ci-dessus' as status;