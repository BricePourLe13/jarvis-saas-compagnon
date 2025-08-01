-- 🚀 DÉPLOIEMENT COMPLET MONITORING OPENAI REALTIME
-- Script pour créer TOUTES les tables et fonctions nécessaires

-- ==========================================
-- 1. VÉRIFIER ET CRÉER TABLES PRINCIPAL
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
    connection_established_at TIMESTAMPTZ,
    connection_closed_at TIMESTAMPTZ,
    disconnect_reason VARCHAR(255),
    input_audio_format VARCHAR(50) DEFAULT 'pcm16',
    output_audio_format VARCHAR(50) DEFAULT 'pcm16',
    voice_model VARCHAR(100),
    turn_detection_type VARCHAR(50) DEFAULT 'server_vad',
    vad_threshold DECIMAL(3,2),
    vad_prefix_padding_ms INTEGER,
    vad_silence_duration_ms INTEGER,
    total_audio_input_duration_ms INTEGER,
    total_audio_output_duration_ms INTEGER,
    total_user_turns INTEGER DEFAULT 0,
    total_ai_turns INTEGER DEFAULT 0,
    total_interruptions INTEGER DEFAULT 0,
    total_input_tokens INTEGER DEFAULT 0,
    total_output_tokens INTEGER DEFAULT 0,
    total_input_audio_tokens INTEGER DEFAULT 0,
    total_output_audio_tokens INTEGER DEFAULT 0,
    total_cost_usd DECIMAL(10,6),
    had_errors BOOLEAN DEFAULT FALSE,
    error_count INTEGER DEFAULT 0,
    critical_errors TEXT[],
    session_instructions TEXT,
    temperature DECIMAL(3,2),
    max_response_output_tokens VARCHAR(50),
    tools_used TEXT[],
    session_metadata JSONB DEFAULT '{}',
    member_badge_id VARCHAR(255),
    member_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table événements audio
CREATE TABLE IF NOT EXISTS openai_realtime_audio_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES openai_realtime_sessions(session_id) ON DELETE CASCADE,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_timestamp TIMESTAMPTZ DEFAULT NOW(),
    audio_duration_ms INTEGER,
    user_transcript TEXT,
    ai_transcript_partial TEXT,
    ai_transcript_final TEXT,
    confidence_score DECIMAL(4,3),
    voice_activity_detected BOOLEAN DEFAULT FALSE,
    interruption_detected BOOLEAN DEFAULT FALSE,
    event_metadata JSONB DEFAULT '{}'
);

-- Table stats WebRTC
CREATE TABLE IF NOT EXISTS openai_realtime_webrtc_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES openai_realtime_sessions(session_id) ON DELETE CASCADE,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
    measured_at TIMESTAMPTZ DEFAULT NOW(),
    connection_state VARCHAR(50),
    ice_connection_state VARCHAR(50),
    bytes_sent BIGINT DEFAULT 0,
    bytes_received BIGINT DEFAULT 0,
    packets_sent INTEGER DEFAULT 0,
    packets_received INTEGER DEFAULT 0,
    packets_lost INTEGER DEFAULT 0,
    round_trip_time_ms DECIMAL(8,3),
    jitter_ms DECIMAL(8,3),
    audio_level DECIMAL(5,3),
    stats_metadata JSONB DEFAULT '{}'
);

-- Table suivi coûts
CREATE TABLE IF NOT EXISTS openai_realtime_cost_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES openai_realtime_sessions(session_id) ON DELETE CASCADE,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
    hour_bucket TIMESTAMPTZ NOT NULL,
    input_text_tokens INTEGER DEFAULT 0,
    output_text_tokens INTEGER DEFAULT 0,
    input_audio_tokens INTEGER DEFAULT 0,
    output_audio_tokens INTEGER DEFAULT 0,
    input_text_cost_usd DECIMAL(10,6) DEFAULT 0,
    output_text_cost_usd DECIMAL(10,6) DEFAULT 0,
    input_audio_cost_usd DECIMAL(10,6) DEFAULT 0,
    output_audio_tokens_cost_usd DECIMAL(10,6) DEFAULT 0,
    total_cost_usd DECIMAL(10,6) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. CRÉER INDEX POUR PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_openai_sessions_gym_id ON openai_realtime_sessions(gym_id);
CREATE INDEX IF NOT EXISTS idx_openai_sessions_started_at ON openai_realtime_sessions(session_started_at);
CREATE INDEX IF NOT EXISTS idx_openai_sessions_session_id ON openai_realtime_sessions(session_id);

CREATE INDEX IF NOT EXISTS idx_openai_audio_session_id ON openai_realtime_audio_events(session_id);
CREATE INDEX IF NOT EXISTS idx_openai_audio_timestamp ON openai_realtime_audio_events(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_openai_audio_gym_id ON openai_realtime_audio_events(gym_id);

CREATE INDEX IF NOT EXISTS idx_openai_webrtc_session_id ON openai_realtime_webrtc_stats(session_id);
CREATE INDEX IF NOT EXISTS idx_openai_webrtc_measured_at ON openai_realtime_webrtc_stats(measured_at);

CREATE INDEX IF NOT EXISTS idx_openai_cost_hour_bucket ON openai_realtime_cost_tracking(hour_bucket);
CREATE INDEX IF NOT EXISTS idx_openai_cost_gym_id ON openai_realtime_cost_tracking(gym_id);

-- ==========================================
-- 3. CRÉER FONCTIONS ESSENTIELLES
-- ==========================================

-- Fonction: Incrémenter tours utilisateur
CREATE OR REPLACE FUNCTION increment_session_user_turns(p_session_id VARCHAR)
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

-- Fonction: Incrémenter tours IA
CREATE OR REPLACE FUNCTION increment_session_ai_turns(p_session_id VARCHAR)
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

-- Fonction: Métriques temps réel gym
CREATE OR REPLACE FUNCTION get_kiosk_realtime_metrics(p_gym_id UUID, p_hours_back INTEGER DEFAULT 24)
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
        0::DECIMAL as avg_response_quality -- Placeholder
    FROM openai_realtime_sessions
    WHERE gym_id = p_gym_id 
      AND session_started_at >= NOW() - (p_hours_back || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Sessions actives d'un gym
CREATE OR REPLACE FUNCTION get_gym_active_sessions(p_gym_id UUID)
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
        s.member_name,
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

-- ==========================================
-- 4. CRÉER VUES OPTIMISÉES
-- ==========================================

-- Vue: Sessions actives globales
CREATE OR REPLACE VIEW v_openai_realtime_active_sessions AS
SELECT 
    s.session_id,
    s.gym_id,
    s.kiosk_slug,
    s.member_name,
    s.session_started_at,
    EXTRACT(EPOCH FROM (NOW() - s.session_started_at))::INTEGER as duration_seconds,
    s.total_user_turns,
    s.total_ai_turns,
    COALESCE(s.total_cost_usd, 0) as current_cost_usd,
    g.name as gym_name
FROM openai_realtime_sessions s
JOIN gyms g ON s.gym_id = g.id
WHERE s.session_ended_at IS NULL;

-- Vue: Stats kiosks 24h
CREATE OR REPLACE VIEW v_openai_realtime_kiosk_stats_24h AS
SELECT 
    s.gym_id,
    g.name as gym_name,
    s.kiosk_slug,
    COUNT(*)::INTEGER as sessions_24h,
    COUNT(*) FILTER (WHERE s.session_ended_at IS NULL)::INTEGER as active_sessions,
    COALESCE(SUM(s.total_cost_usd), 0)::DECIMAL as total_cost_24h_usd,
    COALESCE(AVG(s.session_duration_seconds), 0)::INTEGER as avg_session_duration,
    COALESCE(SUM(s.total_user_turns), 0)::INTEGER as total_user_turns,
    COALESCE(SUM(s.total_ai_turns), 0)::INTEGER as total_ai_turns,
    MAX(s.session_started_at) as last_session_time
FROM openai_realtime_sessions s
JOIN gyms g ON s.gym_id = g.id
WHERE s.session_started_at >= NOW() - INTERVAL '24 hours'
GROUP BY s.gym_id, g.name, s.kiosk_slug;

-- ==========================================
-- 5. RLS (ROW LEVEL SECURITY)
-- ==========================================

-- Activer RLS sur toutes les tables
ALTER TABLE openai_realtime_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE openai_realtime_audio_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE openai_realtime_webrtc_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE openai_realtime_cost_tracking ENABLE ROW LEVEL SECURITY;

-- Policies pour admin total
CREATE POLICY IF NOT EXISTS "Admin complet OpenAI sessions" ON openai_realtime_sessions
FOR ALL TO authenticated USING (auth.role() = 'super_admin');

CREATE POLICY IF NOT EXISTS "Admin complet OpenAI audio" ON openai_realtime_audio_events
FOR ALL TO authenticated USING (auth.role() = 'super_admin');

CREATE POLICY IF NOT EXISTS "Admin complet OpenAI webrtc" ON openai_realtime_webrtc_stats
FOR ALL TO authenticated USING (auth.role() = 'super_admin');

CREATE POLICY IF NOT EXISTS "Admin complet OpenAI costs" ON openai_realtime_cost_tracking
FOR ALL TO authenticated USING (auth.role() = 'super_admin');

-- ==========================================
-- SUCCÈS
-- ==========================================

SELECT 
    '🎉 DÉPLOIEMENT MONITORING COMPLET RÉUSSI' as status,
    'Tables créées: openai_realtime_sessions, openai_realtime_audio_events, openai_realtime_webrtc_stats, openai_realtime_cost_tracking' as tables,
    'Fonctions créées: get_kiosk_realtime_metrics, get_gym_active_sessions, increment_session_*_turns' as functions,
    'Vues créées: v_openai_realtime_active_sessions, v_openai_realtime_kiosk_stats_24h' as views,
    'RLS activé avec policies pour super_admin' as security;