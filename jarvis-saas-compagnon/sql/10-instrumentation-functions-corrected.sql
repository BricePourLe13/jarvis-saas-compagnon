-- ========================================================
-- FONCTIONS SQL POUR L'INSTRUMENTATION OPENAI REALTIME - VERSION CORRIGÉE
-- ========================================================

-- Fonction pour incrémenter les tours utilisateur
CREATE OR REPLACE FUNCTION increment_session_user_turns(p_session_id TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE openai_realtime_sessions 
    SET total_user_turns = total_user_turns + 1,
        updated_at = now()
    WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour incrémenter les tours IA
CREATE OR REPLACE FUNCTION increment_session_ai_turns(p_session_id TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE openai_realtime_sessions 
    SET total_ai_turns = total_ai_turns + 1,
        updated_at = now()
    WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour incrémenter les interruptions
CREATE OR REPLACE FUNCTION increment_session_interruptions(p_session_id TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE openai_realtime_sessions 
    SET total_interruptions = total_interruptions + 1,
        updated_at = now()
    WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir le statut d'une session en temps réel
CREATE OR REPLACE FUNCTION get_session_realtime_status(p_session_id TEXT)
RETURNS TABLE(
    session_id TEXT,
    status TEXT,
    duration_seconds INTEGER,
    user_turns INTEGER,
    ai_turns INTEGER,
    interruptions INTEGER,
    current_cost_usd NUMERIC,
    member_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.session_id,
        CASE 
            WHEN s.session_ended_at IS NULL THEN 'active'
            ELSE 'completed'
        END as status,
        CASE 
            WHEN s.session_ended_at IS NULL THEN EXTRACT(EPOCH FROM (now() - s.session_started_at))::INTEGER
            ELSE s.session_duration_seconds
        END as duration_seconds,
        s.total_user_turns,
        s.total_ai_turns,
        s.total_interruptions,
        COALESCE(s.total_cost_usd, 0) as current_cost_usd,
        (s.session_metadata->>'member_name')::TEXT as member_name
    FROM openai_realtime_sessions s
    WHERE s.session_id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les sessions actives d'un gym
CREATE OR REPLACE FUNCTION get_gym_active_sessions(p_gym_id UUID)
RETURNS TABLE(
    session_id TEXT,
    kiosk_slug TEXT,
    member_name TEXT,
    duration_seconds INTEGER,
    user_turns INTEGER,
    ai_turns INTEGER,
    current_cost_usd NUMERIC,
    started_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.session_id,
        s.kiosk_slug,
        (s.session_metadata->>'member_name')::TEXT as member_name,
        EXTRACT(EPOCH FROM (now() - s.session_started_at))::INTEGER as duration_seconds,
        s.total_user_turns,
        s.total_ai_turns,
        COALESCE(s.total_cost_usd, 0) as current_cost_usd,
        s.session_started_at
    FROM openai_realtime_sessions s
    WHERE s.gym_id = p_gym_id 
      AND s.session_ended_at IS NULL
    ORDER BY s.session_started_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer les métriques temps réel d'un kiosk
CREATE OR REPLACE FUNCTION get_kiosk_realtime_metrics(p_gym_id UUID, p_hours_back INTEGER DEFAULT 24)
RETURNS TABLE(
    total_sessions INTEGER,
    active_sessions INTEGER,
    total_cost_24h NUMERIC,
    avg_session_duration NUMERIC,
    total_user_interactions INTEGER,
    total_ai_responses INTEGER,
    avg_response_quality NUMERIC,
    last_session_time TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_sessions,
        COUNT(*) FILTER (WHERE s.session_ended_at IS NULL)::INTEGER as active_sessions,
        COALESCE(SUM(s.total_cost_usd), 0) as total_cost_24h,
        COALESCE(AVG(s.session_duration_seconds), 0) as avg_session_duration,
        COALESCE(SUM(s.total_user_turns), 0)::INTEGER as total_user_interactions,
        COALESCE(SUM(s.total_ai_turns), 0)::INTEGER as total_ai_responses,
        -- Qualité basée sur le ratio tours IA / tours utilisateur (max 1.0)
        CASE 
            WHEN COALESCE(SUM(s.total_user_turns), 0) > 0 THEN 
                LEAST(COALESCE(SUM(s.total_ai_turns), 0)::NUMERIC / COALESCE(SUM(s.total_user_turns), 1), 1.0)
            ELSE 0
        END as avg_response_quality,
        MAX(s.session_started_at) as last_session_time
    FROM openai_realtime_sessions s
    WHERE s.gym_id = p_gym_id 
      AND s.session_started_at > (now() - (p_hours_back || ' hours')::INTERVAL);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour détecter les anomalies de session
CREATE OR REPLACE FUNCTION detect_session_anomalies(p_gym_id UUID)
RETURNS TABLE(
    anomaly_type TEXT,
    session_id TEXT,
    description TEXT,
    severity TEXT,
    detected_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Sessions anormalement longues (> 10 minutes)
    RETURN QUERY
    SELECT 
        'long_session'::TEXT as anomaly_type,
        s.session_id,
        'Session dépassant 10 minutes de durée'::TEXT as description,
        'warning'::TEXT as severity,
        now() as detected_at
    FROM openai_realtime_sessions s
    WHERE s.gym_id = p_gym_id 
      AND s.session_ended_at IS NULL
      AND EXTRACT(EPOCH FROM (now() - s.session_started_at)) > 600;

    -- Sessions avec coût anormalement élevé (> $0.50)
    RETURN QUERY
    SELECT 
        'high_cost'::TEXT as anomaly_type,
        s.session_id,
        'Coût de session supérieur à $0.50'::TEXT as description,
        'error'::TEXT as severity,
        now() as detected_at
    FROM openai_realtime_sessions s
    WHERE s.gym_id = p_gym_id 
      AND s.total_cost_usd > 0.50
      AND s.session_started_at > (now() - INTERVAL '1 hour');

    -- Sessions avec beaucoup d'interruptions (> 10)
    RETURN QUERY
    SELECT 
        'high_interruptions'::TEXT as anomaly_type,
        s.session_id,
        'Nombre d''interruptions élevé (> 10)'::TEXT as description,
        'warning'::TEXT as severity,
        now() as detected_at
    FROM openai_realtime_sessions s
    WHERE s.gym_id = p_gym_id 
      AND s.total_interruptions > 10
      AND s.session_started_at > (now() - INTERVAL '1 hour');
END;
$$ LANGUAGE plpgsql;

-- Vue pour le dashboard temps réel
CREATE OR REPLACE VIEW v_realtime_dashboard AS
SELECT 
    g.id as gym_id,
    g.name as gym_name,
    f.name as franchise_name,
    COUNT(s.id) FILTER (WHERE s.session_ended_at IS NULL) as active_sessions,
    COUNT(s.id) FILTER (WHERE s.session_started_at > now() - INTERVAL '24 hours') as sessions_24h,
    COALESCE(SUM(s.total_cost_usd) FILTER (WHERE s.session_started_at > now() - INTERVAL '24 hours'), 0) as cost_24h,
    COALESCE(AVG(s.session_duration_seconds) FILTER (WHERE s.session_started_at > now() - INTERVAL '24 hours'), 0) as avg_duration_24h,
    MAX(s.session_started_at) as last_session_time,
    -- Status global du kiosk
    CASE 
        WHEN COUNT(s.id) FILTER (WHERE s.session_ended_at IS NULL) > 0 THEN 'active'
        WHEN MAX(s.session_started_at) > now() - INTERVAL '2 hours' THEN 'recent'
        WHEN MAX(s.session_started_at) > now() - INTERVAL '24 hours' THEN 'idle'
        ELSE 'offline'
    END as kiosk_status
FROM gyms g
LEFT JOIN franchises f ON g.franchise_id = f.id
LEFT JOIN openai_realtime_sessions s ON g.id = s.gym_id
GROUP BY g.id, g.name, f.name;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_openai_sessions_gym_started ON openai_realtime_sessions(gym_id, session_started_at);
CREATE INDEX IF NOT EXISTS idx_openai_sessions_active ON openai_realtime_sessions(gym_id) WHERE session_ended_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_openai_audio_events_session_time ON openai_realtime_audio_events(session_id, event_timestamp);
CREATE INDEX IF NOT EXISTS idx_openai_webrtc_session_time ON openai_realtime_webrtc_stats(session_id, timestamp);

-- Commentaires pour la documentation
COMMENT ON FUNCTION increment_session_user_turns IS 'Incrémente le compteur de tours utilisateur pour une session';
COMMENT ON FUNCTION increment_session_ai_turns IS 'Incrémente le compteur de tours IA pour une session';
COMMENT ON FUNCTION get_session_realtime_status IS 'Retourne le statut temps réel d''une session';
COMMENT ON FUNCTION get_gym_active_sessions IS 'Retourne toutes les sessions actives d''un gym';
COMMENT ON FUNCTION get_kiosk_realtime_metrics IS 'Calcule les métriques temps réel d''un kiosk';
COMMENT ON FUNCTION detect_session_anomalies IS 'Détecte les anomalies dans les sessions d''un gym';
COMMENT ON VIEW v_realtime_dashboard IS 'Vue consolidée pour le dashboard temps réel';

SELECT '✅ Fonctions d''instrumentation OpenAI Realtime CORRIGÉES créées avec succès!' as status;