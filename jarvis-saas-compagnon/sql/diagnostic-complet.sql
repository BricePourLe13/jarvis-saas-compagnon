-- 🔍 DIAGNOSTIC COMPLET PROBLÈME MONITORING
-- Exécute ce script dans Supabase pour identifier les problèmes

-- ==========================================
-- 1. VÉRIFIER TABLES EXISTANTES
-- ==========================================
SELECT 
    '=== TABLES EXISTANTES ===' as section,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name LIKE 'openai_realtime%' 
   OR table_name LIKE '%session%'
   OR table_name LIKE '%jarvis%'
ORDER BY table_name;

-- ==========================================
-- 2. COMPTER DONNÉES DANS CHAQUE TABLE
-- ==========================================

-- Sessions classiques JARVIS (anciennes)
SELECT 
    '=== SESSIONS JARVIS CLASSIQUES ===' as section,
    COUNT(*) as count_total,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as count_24h,
    MAX(created_at) as derniere_session
FROM jarvis_sessions
WHERE 1=1;

-- Tables OpenAI Realtime (nouvelles) - SI ELLES EXISTENT
DO $$ 
BEGIN
    -- Test si table existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'openai_realtime_sessions') THEN
        RAISE NOTICE '=== SESSIONS OPENAI REALTIME ===';
        PERFORM COUNT(*) FROM openai_realtime_sessions;
        RAISE NOTICE 'Total sessions OpenAI: %', (SELECT COUNT(*) FROM openai_realtime_sessions);
        RAISE NOTICE 'Sessions 24h: %', (SELECT COUNT(*) FROM openai_realtime_sessions WHERE session_started_at >= NOW() - INTERVAL '24 hours');
    ELSE
        RAISE NOTICE '❌ TABLE openai_realtime_sessions N''EXISTE PAS';
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'openai_realtime_audio_events') THEN
        RAISE NOTICE 'Total audio events: %', (SELECT COUNT(*) FROM openai_realtime_audio_events);
    ELSE
        RAISE NOTICE '❌ TABLE openai_realtime_audio_events N''EXISTE PAS';
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'openai_realtime_webrtc_stats') THEN
        RAISE NOTICE 'Total WebRTC stats: %', (SELECT COUNT(*) FROM openai_realtime_webrtc_stats);
    ELSE
        RAISE NOTICE '❌ TABLE openai_realtime_webrtc_stats N''EXISTE PAS';
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'openai_realtime_cost_tracking') THEN
        RAISE NOTICE 'Total cost tracking: %', (SELECT COUNT(*) FROM openai_realtime_cost_tracking);
    ELSE
        RAISE NOTICE '❌ TABLE openai_realtime_cost_tracking N''EXISTE PAS';
    END IF;
END $$;

-- ==========================================
-- 3. VÉRIFIER FONCTIONS SQL
-- ==========================================
SELECT 
    '=== FONCTIONS SQL ===' as section,
    proname as function_name,
    pronargs as nb_arguments
FROM pg_proc 
WHERE proname LIKE '%session%' 
   OR proname LIKE '%kiosk%realtime%'
   OR proname LIKE 'get_gym_active_sessions'
   OR proname LIKE 'get_kiosk_realtime_metrics'
   OR proname LIKE 'increment_session%turns'
ORDER BY proname;

-- ==========================================
-- 4. VÉRIFIER VUES
-- ==========================================
SELECT 
    '=== VUES SQL ===' as section,
    viewname as view_name,
    CASE 
        WHEN viewname LIKE '%realtime%' THEN '🆕 Nouvelle vue OpenAI'
        ELSE '📊 Vue existante'
    END as type_vue
FROM pg_views 
WHERE viewname LIKE '%realtime%' 
   OR viewname LIKE '%session%'
   OR viewname LIKE '%kiosk%'
ORDER BY viewname;

-- ==========================================
-- 5. TESTER FONCTION GET_KIOSK_REALTIME_METRICS
-- ==========================================
DO $$ 
DECLARE
    test_gym_id text;
BEGIN
    -- Prendre le premier gym disponible
    SELECT id INTO test_gym_id FROM gyms LIMIT 1;
    
    IF test_gym_id IS NOT NULL THEN
        RAISE NOTICE '=== TEST FONCTION get_kiosk_realtime_metrics ===';
        RAISE NOTICE 'Test avec gym_id: %', test_gym_id;
        
        -- Tester si la fonction existe
        IF EXISTS (SELECT FROM pg_proc WHERE proname = 'get_kiosk_realtime_metrics') THEN
            RAISE NOTICE '✅ Fonction get_kiosk_realtime_metrics existe';
            -- Ici on pourrait tester l'appel mais c'est risqué en diagnostic
        ELSE
            RAISE NOTICE '❌ Fonction get_kiosk_realtime_metrics N''EXISTE PAS';
        END IF;
    ELSE
        RAISE NOTICE '❌ Aucun gym trouvé pour tester';
    END IF;
END $$;

-- ==========================================
-- 6. DIAGNOSTIC FINAL
-- ==========================================
SELECT 
    '=== DIAGNOSTIC FINAL ===' as section,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'openai_realtime_sessions') 
        THEN '✅ Tables OpenAI Realtime existent'
        ELSE '❌ Tables OpenAI Realtime MANQUANTES - Exécuter 09-openai-realtime-monitoring.sql'
    END as status_tables,
    
    CASE 
        WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'get_kiosk_realtime_metrics') 
        THEN '✅ Fonctions monitoring existent'
        ELSE '❌ Fonctions monitoring MANQUANTES - Exécuter 10-instrumentation-functions-corrected.sql'
    END as status_functions,
    
    (SELECT COUNT(*) FROM jarvis_sessions) as sessions_classiques_total,
    
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'openai_realtime_sessions') 
        THEN COALESCE((SELECT COUNT(*) FROM openai_realtime_sessions), 0)
        ELSE -1
    END as sessions_openai_total;

-- ==========================================
-- 7. INSTRUCTIONS DE RÉPARATION
-- ==========================================
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 === INSTRUCTIONS DE RÉPARATION ===';
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'openai_realtime_sessions') THEN
        RAISE NOTICE '1. ❌ Exécuter: sql/09-openai-realtime-monitoring.sql';
    ELSE
        RAISE NOTICE '1. ✅ Tables OpenAI Realtime OK';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'get_kiosk_realtime_metrics') THEN
        RAISE NOTICE '2. ❌ Exécuter: sql/10-instrumentation-functions-corrected.sql';
    ELSE
        RAISE NOTICE '2. ✅ Fonctions monitoring OK';
    END IF;
    
    RAISE NOTICE '3. 🧪 Tester une session kiosk pour vérifier instrumentation';
    RAISE NOTICE '4. 🔄 Rafraîchir page admin pour voir nouvelles données';
END $$;