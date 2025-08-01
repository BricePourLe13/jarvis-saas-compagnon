-- 🎯 MONITORING OPENAI REALTIME API - Métriques techniques RÉELLES
-- Basé sur la documentation officielle OpenAI Realtime API

-- ====================================
-- 🤖 TABLE: openai_realtime_sessions
-- ====================================

CREATE TABLE IF NOT EXISTS openai_realtime_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL, -- OpenAI session ID
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  kiosk_slug TEXT NOT NULL,
  
  -- 📅 Session Timeline
  session_started_at TIMESTAMPTZ NOT NULL,
  session_ended_at TIMESTAMPTZ,
  session_duration_seconds INTEGER, -- Durée totale session
  
  -- 🔌 Connexion & Transport
  connection_type TEXT NOT NULL CHECK (connection_type IN ('websocket', 'webrtc')), 
  connection_established_at TIMESTAMPTZ,
  connection_closed_at TIMESTAMPTZ,
  disconnect_reason TEXT, -- 'user_ended', 'timeout', 'error', 'technical_failure'
  
  -- 🎙️ Audio Configuration
  input_audio_format TEXT DEFAULT 'pcm16', -- Format audio input
  output_audio_format TEXT DEFAULT 'pcm16', -- Format audio output
  voice_model TEXT, -- 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'
  
  -- 🔄 Turn Detection Settings
  turn_detection_type TEXT DEFAULT 'server_vad', -- 'none', 'server_vad', 'semantic_vad'
  vad_threshold DECIMAL(3,2), -- Seuil détection voix
  vad_prefix_padding_ms INTEGER, -- Padding avant détection
  vad_silence_duration_ms INTEGER, -- Durée silence pour fin de parole
  
  -- 📊 Session Metrics
  total_audio_input_duration_ms INTEGER, -- Durée totale audio utilisateur
  total_audio_output_duration_ms INTEGER, -- Durée totale audio IA
  total_user_turns INTEGER DEFAULT 0, -- Nombre prises de parole utilisateur
  total_ai_turns INTEGER DEFAULT 0, -- Nombre réponses IA
  total_interruptions INTEGER DEFAULT 0, -- Interruptions utilisateur
  
  -- 💰 Coûts & Tokens
  total_input_tokens INTEGER DEFAULT 0,
  total_output_tokens INTEGER DEFAULT 0,
  total_input_audio_tokens INTEGER DEFAULT 0,
  total_output_audio_tokens INTEGER DEFAULT 0,
  total_cost_usd DECIMAL(10,6),
  
  -- 🚨 Erreurs Session
  had_errors BOOLEAN DEFAULT false,
  error_count INTEGER DEFAULT 0,
  critical_errors TEXT[], -- Array des erreurs critiques
  
  -- 📝 Métadonnées
  session_instructions TEXT, -- Instructions système utilisées
  temperature DECIMAL(3,2), -- Température modèle
  max_response_output_tokens TEXT, -- Limite tokens réponse
  tools_used TEXT[], -- Fonctions appelées pendant session
  session_metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================
-- 🎙️ TABLE: openai_realtime_audio_events
-- ====================================

CREATE TABLE IF NOT EXISTS openai_realtime_audio_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES openai_realtime_sessions(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  
  -- 📝 Event Details
  event_type TEXT NOT NULL, -- Types d'événements OpenAI
  event_id TEXT, -- ID événement OpenAI (optionnel)
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- 🎤 Audio Input Events
  -- 'input_audio_buffer.speech_started', 'input_audio_buffer.speech_stopped'
  -- 'input_audio_buffer.committed', 'conversation.item.input_audio_transcription.completed'
  speech_started_at TIMESTAMPTZ,
  speech_stopped_at TIMESTAMPTZ,
  speech_duration_ms INTEGER,
  user_transcript TEXT, -- Transcription Whisper
  
  -- 🔊 Audio Output Events  
  -- 'response.audio_transcript.delta', 'response.audio_transcript.done'
  -- 'response.audio.delta', 'response.audio.done'
  ai_transcript_partial TEXT, -- Transcript partiel IA
  ai_transcript_final TEXT, -- Transcript final IA
  audio_bytes_received INTEGER, -- Bytes audio reçus
  audio_generation_duration_ms INTEGER,
  
  -- ⚡ Response Events
  -- 'response.created', 'response.done', 'response.cancelled'
  response_id TEXT, -- ID réponse OpenAI
  response_status TEXT, -- 'in_progress', 'completed', 'cancelled', 'failed'
  response_latency_ms INTEGER, -- Temps entre requête et début réponse
  
  -- 🛠️ Function Call Events
  -- 'response.function_call_arguments.done'
  function_name TEXT,
  function_arguments JSONB,
  function_call_id TEXT,
  
  -- 🚨 Error Events
  error_type TEXT, -- Type erreur OpenAI
  error_message TEXT,
  error_code TEXT,
  
  -- 📊 Technical Metrics
  buffer_size_bytes INTEGER, -- Taille buffer audio
  processing_time_ms INTEGER, -- Temps traitement événement
  
  -- 📝 Raw Event Data
  raw_event_data JSONB, -- Données brutes événement OpenAI
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================
-- 🌐 TABLE: openai_realtime_webrtc_stats
-- ====================================

CREATE TABLE IF NOT EXISTS openai_realtime_webrtc_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES openai_realtime_sessions(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  
  -- ⏰ Timing
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  stats_interval_seconds INTEGER DEFAULT 5, -- Intervalle mesure
  
  -- 🔌 Connection Stats (RTCPeerConnection)
  connection_state TEXT, -- 'new', 'connecting', 'connected', 'disconnected', 'failed', 'closed'
  ice_connection_state TEXT, -- 'new', 'checking', 'connected', 'completed', 'failed', 'disconnected', 'closed'
  ice_gathering_state TEXT, -- 'new', 'gathering', 'complete'
  
  -- 📡 Network Quality
  rtt_ms INTEGER, -- Round Trip Time
  packets_sent INTEGER, -- Paquets envoyés
  packets_received INTEGER, -- Paquets reçus
  packets_lost INTEGER, -- Paquets perdus
  packet_loss_rate DECIMAL(5,4), -- Taux perte paquets (0-1)
  
  -- 🎵 Audio Quality (inbound/outbound streams)
  audio_level_input DECIMAL(5,2), -- Niveau audio entrée (0-1)
  audio_level_output DECIMAL(5,2), -- Niveau audio sortie (0-1)
  jitter_ms DECIMAL(8,2), -- Gigue réseau
  
  -- 📊 Bandwidth
  bytes_sent INTEGER, -- Bytes envoyés
  bytes_received INTEGER, -- Bytes reçus
  bitrate_kbps INTEGER, -- Débit actuel
  
  -- 🎧 Audio Stream Stats
  audio_codec TEXT, -- Codec utilisé (probablement Opus)
  sample_rate INTEGER, -- Taux échantillonnage
  channels INTEGER, -- Nombre canaux audio
  
  -- 🔊 Audio Processing
  echo_cancellation_enabled BOOLEAN, -- Annulation écho active
  noise_suppression_enabled BOOLEAN, -- Suppression bruit active
  auto_gain_control_enabled BOOLEAN, -- Contrôle gain automatique
  
  -- 📝 Browser/Device Info
  user_agent TEXT, -- User agent navigateur
  browser_name TEXT, -- Nom navigateur
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  os_name TEXT, -- Système exploitation
  
  -- 📊 Raw WebRTC Stats
  raw_webrtc_stats JSONB, -- Stats WebRTC brutes complètes
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================
-- 💰 TABLE: openai_realtime_cost_tracking
-- ====================================

CREATE TABLE IF NOT EXISTS openai_realtime_cost_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES openai_realtime_sessions(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  
  -- 📅 Période
  hour_bucket TIMESTAMPTZ NOT NULL, -- Bucket horaire (début heure)
  
  -- 📊 Tokens & Usage
  total_sessions INTEGER DEFAULT 0,
  total_session_duration_seconds INTEGER DEFAULT 0,
  total_input_tokens INTEGER DEFAULT 0,
  total_output_tokens INTEGER DEFAULT 0,
  total_input_audio_tokens INTEGER DEFAULT 0,
  total_output_audio_tokens INTEGER DEFAULT 0,
  
  -- 💰 Coûts Détaillés (selon pricing OpenAI)
  input_text_tokens_cost_usd DECIMAL(10,6) DEFAULT 0,
  output_text_tokens_cost_usd DECIMAL(10,6) DEFAULT 0,
  input_audio_tokens_cost_usd DECIMAL(10,6) DEFAULT 0,
  output_audio_tokens_cost_usd DECIMAL(10,6) DEFAULT 0,
  total_cost_usd DECIMAL(10,6) DEFAULT 0,
  
  -- 📈 Performance Metrics
  avg_session_duration_seconds INTEGER,
  avg_response_latency_ms INTEGER,
  avg_turn_count DECIMAL(5,2),
  successful_sessions INTEGER DEFAULT 0,
  failed_sessions INTEGER DEFAULT 0,
  success_rate DECIMAL(5,4), -- Taux succès (0-1)
  
  -- 🌐 Connection Stats
  webrtc_sessions INTEGER DEFAULT 0,
  websocket_sessions INTEGER DEFAULT 0,
  total_connection_failures INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Index unique par gym/heure
  UNIQUE(gym_id, hour_bucket)
);

-- ====================================
-- 📊 INDEXES POUR PERFORMANCE
-- ====================================

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_openai_realtime_sessions_gym_id ON openai_realtime_sessions(gym_id);
CREATE INDEX IF NOT EXISTS idx_openai_realtime_sessions_started_at ON openai_realtime_sessions(session_started_at);
CREATE INDEX IF NOT EXISTS idx_openai_realtime_sessions_kiosk_slug ON openai_realtime_sessions(kiosk_slug);
CREATE INDEX IF NOT EXISTS idx_openai_realtime_sessions_session_id ON openai_realtime_sessions(session_id);

-- Audio events indexes  
CREATE INDEX IF NOT EXISTS idx_openai_realtime_audio_events_session_id ON openai_realtime_audio_events(session_id);
CREATE INDEX IF NOT EXISTS idx_openai_realtime_audio_events_gym_id ON openai_realtime_audio_events(gym_id);
CREATE INDEX IF NOT EXISTS idx_openai_realtime_audio_events_event_type ON openai_realtime_audio_events(event_type);
CREATE INDEX IF NOT EXISTS idx_openai_realtime_audio_events_timestamp ON openai_realtime_audio_events(event_timestamp);

-- WebRTC stats indexes
CREATE INDEX IF NOT EXISTS idx_openai_realtime_webrtc_stats_session_id ON openai_realtime_webrtc_stats(session_id);
CREATE INDEX IF NOT EXISTS idx_openai_realtime_webrtc_stats_gym_id ON openai_realtime_webrtc_stats(gym_id);
CREATE INDEX IF NOT EXISTS idx_openai_realtime_webrtc_stats_measured_at ON openai_realtime_webrtc_stats(measured_at);

-- Cost tracking indexes
CREATE INDEX IF NOT EXISTS idx_openai_realtime_cost_tracking_gym_id ON openai_realtime_cost_tracking(gym_id);
CREATE INDEX IF NOT EXISTS idx_openai_realtime_cost_tracking_hour_bucket ON openai_realtime_cost_tracking(hour_bucket);

-- ====================================
-- 🔒 ROW LEVEL SECURITY
-- ====================================

-- Activer RLS
ALTER TABLE openai_realtime_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE openai_realtime_audio_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE openai_realtime_webrtc_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE openai_realtime_cost_tracking ENABLE ROW LEVEL SECURITY;

-- Politiques d'accès (pour dev/admin complet)
CREATE POLICY "Allow all operations on openai_realtime_sessions" ON openai_realtime_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on openai_realtime_audio_events" ON openai_realtime_audio_events FOR ALL USING (true);
CREATE POLICY "Allow all operations on openai_realtime_webrtc_stats" ON openai_realtime_webrtc_stats FOR ALL USING (true);
CREATE POLICY "Allow all operations on openai_realtime_cost_tracking" ON openai_realtime_cost_tracking FOR ALL USING (true);

-- ====================================
-- 🤖 TRIGGERS
-- ====================================

-- Trigger pour updated_at
CREATE TRIGGER update_openai_realtime_sessions_updated_at
  BEFORE UPDATE ON openai_realtime_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_openai_realtime_cost_tracking_updated_at
  BEFORE UPDATE ON openai_realtime_cost_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- 👁️ VUES DASHBOARD TEMPS RÉEL
-- ====================================

-- Vue status sessions en cours
CREATE OR REPLACE VIEW v_openai_realtime_active_sessions AS
SELECT 
  s.id,
  s.session_id,
  s.gym_id,
  g.name as gym_name,
  s.kiosk_slug,
  s.session_started_at,
  s.connection_type,
  s.voice_model,
  s.turn_detection_type,
  s.total_user_turns,
  s.total_ai_turns,
  s.total_interruptions,
  s.total_cost_usd,
  
  -- Durée session actuelle
  EXTRACT(EPOCH FROM (now() - s.session_started_at))::integer as current_duration_seconds,
  
  -- Dernière activité audio
  (SELECT MAX(ae.event_timestamp) 
   FROM openai_realtime_audio_events ae 
   WHERE ae.session_id = s.id) as last_audio_activity,
   
  -- Qualité connexion WebRTC récente
  (SELECT ws.connection_state 
   FROM openai_realtime_webrtc_stats ws 
   WHERE ws.session_id = s.id 
   ORDER BY ws.measured_at DESC 
   LIMIT 1) as current_connection_state

FROM openai_realtime_sessions s
LEFT JOIN gyms g ON s.gym_id = g.id
WHERE s.session_ended_at IS NULL -- Sessions actives uniquement
ORDER BY s.session_started_at DESC;

-- Vue métriques par kiosk (24h)
CREATE OR REPLACE VIEW v_openai_realtime_kiosk_stats_24h AS
SELECT 
  g.id as gym_id,
  g.name as gym_name,
  g.kiosk_config->>'kiosk_url_slug' as kiosk_slug,
  
  -- Sessions dernières 24h
  COUNT(s.id) as sessions_24h,
  COUNT(CASE WHEN s.session_ended_at IS NOT NULL THEN 1 END) as completed_sessions,
  COUNT(CASE WHEN s.session_ended_at IS NULL THEN 1 END) as active_sessions,
  
  -- Durée moyenne
  AVG(s.session_duration_seconds)::integer as avg_session_duration_seconds,
  SUM(s.session_duration_seconds)::integer as total_session_duration_seconds,
  
  -- Performance audio
  AVG(s.total_user_turns)::decimal(5,2) as avg_user_turns,
  AVG(s.total_ai_turns)::decimal(5,2) as avg_ai_turns,
  AVG(s.total_interruptions)::decimal(5,2) as avg_interruptions,
  
  -- Coûts
  SUM(s.total_cost_usd)::decimal(8,4) as total_cost_24h_usd,
  AVG(s.total_cost_usd)::decimal(6,4) as avg_cost_per_session_usd,
  
  -- Tokens
  SUM(s.total_input_tokens) as total_input_tokens,
  SUM(s.total_output_tokens) as total_output_tokens,
  SUM(s.total_input_audio_tokens) as total_input_audio_tokens,
  SUM(s.total_output_audio_tokens) as total_output_audio_tokens,
  
  -- Erreurs
  COUNT(CASE WHEN s.had_errors THEN 1 END) as sessions_with_errors,
  (COUNT(CASE WHEN s.had_errors THEN 1 END) * 100.0 / NULLIF(COUNT(s.id), 0))::decimal(5,2) as error_rate_percent,
  
  -- Connexions
  COUNT(CASE WHEN s.connection_type = 'webrtc' THEN 1 END) as webrtc_sessions,
  COUNT(CASE WHEN s.connection_type = 'websocket' THEN 1 END) as websocket_sessions,
  
  -- Modèles voix populaires
  string_agg(DISTINCT s.voice_model, ', ') as voice_models_used,
  
  -- Dernière activité
  MAX(s.session_started_at) as last_session_at

FROM gyms g
LEFT JOIN openai_realtime_sessions s ON g.id = s.gym_id 
  AND s.session_started_at > now() - INTERVAL '24 hours'
WHERE g.kiosk_config->>'kiosk_url_slug' IS NOT NULL
GROUP BY g.id, g.name, g.kiosk_config->>'kiosk_url_slug'
ORDER BY sessions_24h DESC;

-- ====================================
-- ✅ VALIDATION
-- ====================================

SELECT 
  '🎯 MONITORING OPENAI REALTIME API CRÉÉ!' as result,
  'Tables: sessions, audio_events, webrtc_stats, cost_tracking' as tables_created,
  'Vues: v_openai_realtime_active_sessions, v_openai_realtime_kiosk_stats_24h' as views_created,
  'Métriques: WebRTC, Audio Events, Coûts OpenAI, Performance' as metrics_available,
  now() as created_at;