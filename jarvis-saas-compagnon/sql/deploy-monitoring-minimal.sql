-- 🚀 DÉPLOIEMENT MONITORING MINIMAL - TABLES SEULEMENT
-- Script ultra simple pour créer juste les tables et fonctions de base

-- ==========================================
-- 1. SUPPRIMER VUES EXISTANTES (pour éviter conflits)
-- ==========================================
DROP VIEW IF EXISTS v_openai_realtime_active_sessions;
DROP VIEW IF EXISTS v_openai_realtime_kiosk_stats_24h;

-- ==========================================
-- 2. CRÉER TABLES PRINCIPALES
-- ==========================================

-- Table sessions OpenAI Realtime
CREATE TABLE IF NOT EXISTS openai_realtime_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
    kiosk_slug VARCHAR(255),
    session_started_at TIMESTAMPTZ DEFAULT NOW(),
    session_ended_at TIMESTAMPTZ,
    session_duration_seconds INTEGER,
    connection_type VARCHAR(50) DEFAULT 'webrtc',
    voice_model VARCHAR(100),
    turn_detection_type VARCHAR(50) DEFAULT 'server_vad',
    total_user_turns INTEGER DEFAULT 0,
    total_ai_turns INTEGER DEFAULT 0,
    total_input_tokens INTEGER DEFAULT 0,
    total_output_tokens INTEGER DEFAULT 0,
    total_cost_usd DECIMAL(10,6),
    had_errors BOOLEAN DEFAULT FALSE,
    error_count INTEGER DEFAULT 0,
    session_metadata JSONB DEFAULT '{}',
    member_badge_id VARCHAR(255),
    member_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table événements audio (version minimale)
CREATE TABLE IF NOT EXISTS openai_realtime_audio_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES openai_realtime_sessions(session_id) ON DELETE CASCADE,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_transcript TEXT,
    ai_transcript_final TEXT,
    event_metadata JSONB DEFAULT '{}'
);

-- Table stats WebRTC (version minimale)
CREATE TABLE IF NOT EXISTS openai_realtime_webrtc_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES openai_realtime_sessions(session_id) ON DELETE CASCADE,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
    measured_at TIMESTAMPTZ DEFAULT NOW(),
    connection_state VARCHAR(50),
    bytes_sent BIGINT DEFAULT 0,
    bytes_received BIGINT DEFAULT 0,
    stats_metadata JSONB DEFAULT '{}'
);

-- Table suivi coûts (version minimale)
CREATE TABLE IF NOT EXISTS openai_realtime_cost_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES openai_realtime_sessions(session_id) ON DELETE CASCADE,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
    hour_bucket TIMESTAMPTZ NOT NULL,
    total_cost_usd DECIMAL(10,6) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. CRÉER INDEX ESSENTIELS
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_openai_sessions_gym_id ON openai_realtime_sessions(gym_id);
CREATE INDEX IF NOT EXISTS idx_openai_sessions_session_id ON openai_realtime_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_openai_audio_session_id ON openai_realtime_audio_events(session_id);

-- ==========================================
-- 4. SUPPRIMER FONCTIONS EXISTANTES
-- ==========================================
DROP FUNCTION IF EXISTS increment_session_user_turns(VARCHAR);
DROP FUNCTION IF EXISTS increment_session_ai_turns(VARCHAR);
DROP FUNCTION IF EXISTS get_kiosk_realtime_metrics(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_kiosk_realtime_metrics(UUID);
DROP FUNCTION IF EXISTS get_gym_active_sessions(UUID);

-- ==========================================
-- 5. CRÉER FONCTIONS ESSENTIELLES
-- ==========================================

-- Fonction simple: Métriques gym
CREATE FUNCTION get_kiosk_realtime_metrics(p_gym_id UUID, p_hours_back INTEGER DEFAULT 24)
RETURNS TABLE (
    total_sessions INTEGER,
    active_sessions INTEGER,
    total_cost_24h DECIMAL,
    avg_session_duration INTEGER,
    total_user_interactions INTEGER,
    total_ai_responses INTEGER,
    last_session_time TIMESTAMPTZ,
    avg_response_quality DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_sessions,
        COUNT(*) FILTER (WHERE session_ended_at IS NULL)::INTEGER as active_sessions,
        COALESCE(SUM(total_cost_usd), 0)::DECIMAL as total_cost_24h,
        COALESCE(AVG(session_duration_seconds), 0)::INTEGER as avg_session_duration,
        COALESCE(SUM(total_user_turns), 0)::INTEGER as total_user_interactions,
        COALESCE(SUM(total_ai_turns), 0)::INTEGER as total_ai_responses,
        MAX(session_started_at) as last_session_time,
        0::DECIMAL as avg_response_quality
    FROM openai_realtime_sessions
    WHERE gym_id = p_gym_id 
      AND session_started_at >= NOW() - (p_hours_back || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Fonction simple: Sessions actives
CREATE FUNCTION get_gym_active_sessions(p_gym_id UUID)
RETURNS TABLE (
    session_id VARCHAR,
    kiosk_slug VARCHAR,
    member_name VARCHAR,
    duration_seconds INTEGER,
    user_turns INTEGER,
    ai_turns INTEGER,
    current_cost_usd DECIMAL,
    started_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.session_id,
        s.kiosk_slug,
        COALESCE(s.member_name, 'Anonyme'),
        EXTRACT(EPOCH FROM (NOW() - s.session_started_at))::INTEGER as duration_seconds,
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

-- Fonctions d'incrémentation
CREATE FUNCTION increment_session_user_turns(p_session_id VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE openai_realtime_sessions 
    SET total_user_turns = total_user_turns + 1,
        updated_at = NOW()
    WHERE session_id = p_session_id
    RETURNING total_user_turns INTO new_count;
    
    RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION increment_session_ai_turns(p_session_id VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE openai_realtime_sessions 
    SET total_ai_turns = total_ai_turns + 1,
        updated_at = NOW()
    WHERE session_id = p_session_id
    RETURNING total_ai_turns INTO new_count;
    
    RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 6. TEST FINAL
-- ==========================================
SELECT 
    '🎉 DÉPLOIEMENT MONITORING MINIMAL RÉUSSI' as status,
    'Tables: openai_realtime_sessions + 3 autres' as tables,
    'Fonctions: get_kiosk_realtime_metrics, get_gym_active_sessions + 2 autres' as functions,
    'Prêt pour tests d''instrumentation' as next_step;