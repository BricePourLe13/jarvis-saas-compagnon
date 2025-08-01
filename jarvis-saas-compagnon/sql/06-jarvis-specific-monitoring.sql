-- 🤖 MONITORING SPÉCIFIQUE JARVIS - IA, WebRTC, Sessions
-- Tables et métriques adaptées aux besoins réels JARVIS

-- ====================================
-- 🤖 TABLE: jarvis_ai_metrics (Métriques IA)
-- ====================================

CREATE TABLE IF NOT EXISTS jarvis_ai_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  kiosk_slug TEXT NOT NULL,
  session_id UUID, -- Lien vers jarvis_sessions
  
  -- 🤖 Modèle IA utilisé
  ai_model TEXT NOT NULL, -- 'gpt-4o-realtime', 'gpt-4o', 'gpt-4-turbo', etc.
  ai_provider TEXT DEFAULT 'openai', -- 'openai', 'anthropic', etc.
  
  -- ⚡ Performance IA
  api_response_time_ms INTEGER, -- Temps réponse API
  tokens_input INTEGER, -- Tokens envoyés
  tokens_output INTEGER, -- Tokens reçus
  cost_usd DECIMAL(10,6), -- Coût exact de la requête
  
  -- 🎯 Qualité Interaction
  response_quality TEXT CHECK (response_quality IN ('excellent', 'good', 'fair', 'poor')),
  user_satisfaction INTEGER CHECK (user_satisfaction BETWEEN 1 AND 5),
  conversation_success BOOLEAN, -- Session complétée avec succès
  
  -- 🚨 Erreurs IA
  error_occurred BOOLEAN DEFAULT false,
  error_type TEXT, -- 'timeout', 'quota_exceeded', 'model_error', 'network_error'
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- ⏰ Timeline
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER, -- Durée totale de l'interaction
  
  -- 📊 Métadonnées
  request_metadata JSONB DEFAULT '{}'::jsonb,
  response_metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================
-- 🎙️ TABLE: jarvis_webrtc_metrics (WebRTC Audio)
-- ====================================

CREATE TABLE IF NOT EXISTS jarvis_webrtc_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  kiosk_slug TEXT NOT NULL,
  session_id UUID, -- Lien vers jarvis_sessions
  
  -- 🔊 Qualité Audio
  audio_input_level DECIMAL(5,2), -- Niveau micro (0-100)
  audio_output_level DECIMAL(5,2), -- Volume speakers (0-100)
  audio_quality_score DECIMAL(3,2), -- Score qualité global (0-1)
  
  -- 🌐 Connexion WebRTC
  connection_quality TEXT CHECK (connection_quality IN ('excellent', 'good', 'fair', 'poor')),
  ice_connection_state TEXT, -- 'connected', 'disconnected', 'failed', etc.
  peer_connection_state TEXT,
  
  -- 📊 Statistiques Réseau
  rtt_ms INTEGER, -- Round Trip Time
  packets_lost INTEGER, -- Paquets perdus
  jitter_ms DECIMAL(8,2), -- Variation délai
  bandwidth_kbps INTEGER, -- Bande passante utilisée
  
  -- 🎤 Reconnaissance Vocale
  speech_recognition_accuracy DECIMAL(5,2), -- Précision reconnaissance (%)
  speech_interruptions INTEGER, -- Nombre d'interruptions
  silence_detection_quality TEXT CHECK (silence_detection_quality IN ('excellent', 'good', 'fair', 'poor')),
  
  -- 🚨 Problèmes Détectés
  audio_dropouts INTEGER, -- Coupures audio
  echo_detected BOOLEAN, -- Écho détecté
  noise_level TEXT CHECK (noise_level IN ('low', 'medium', 'high')),
  
  -- ⏰ Durée
  session_duration_ms INTEGER,
  active_talk_time_ms INTEGER, -- Temps de parole effectif
  
  -- 🔧 Infos Technique
  browser_info JSONB DEFAULT '{}'::jsonb,
  device_info JSONB DEFAULT '{}'::jsonb,
  
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================
-- 👥 TABLE: jarvis_user_interactions (Interactions Utilisateurs)
-- ====================================

CREATE TABLE IF NOT EXISTS jarvis_user_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  kiosk_slug TEXT NOT NULL,
  session_id UUID, -- Lien vers jarvis_sessions
  
  -- 👤 Identification Utilisateur
  member_badge_id TEXT, -- ID badge RFID
  member_type TEXT CHECK (member_type IN ('member', 'visitor', 'staff', 'unknown')),
  is_returning_user BOOLEAN, -- Utilisateur récurrent
  
  -- 🎯 Type d'Interaction
  interaction_type TEXT NOT NULL, -- 'info_request', 'booking', 'complaint', 'general_chat', etc.
  intent_detected TEXT[], -- Intents IA détectés
  conversation_topic TEXT[], -- Sujets abordés
  
  -- 📊 Déroulement Session
  session_started_at TIMESTAMPTZ NOT NULL,
  session_ended_at TIMESTAMPTZ,
  total_duration_seconds INTEGER,
  user_talk_time_seconds INTEGER, -- Temps où l'utilisateur parle
  jarvis_talk_time_seconds INTEGER, -- Temps où JARVIS parle
  
  -- 🎭 Sentiment & Satisfaction
  initial_sentiment DECIMAL(3,2), -- Sentiment au début (-1 à 1)
  final_sentiment DECIMAL(3,2), -- Sentiment à la fin
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  nps_score INTEGER CHECK (nps_score BETWEEN 0 AND 10), -- Net Promoter Score
  
  -- ✅ Résultat Session
  session_completed BOOLEAN, -- Session terminée normalement
  user_goal_achieved BOOLEAN, -- Objectif utilisateur atteint
  escalation_required BOOLEAN, -- Besoin intervention humaine
  
  -- 🚪 Raison de Fin
  end_reason TEXT CHECK (end_reason IN (
    'user_satisfied', 'user_left', 'timeout', 'technical_error', 
    'escalated_to_staff', 'jarvis_error', 'user_frustrated'
  )),
  
  -- 📝 Feedback
  user_feedback TEXT, -- Commentaire utilisateur optionnel
  issue_resolved BOOLEAN, -- Problème résolu
  
  -- 📊 Métadonnées
  conversation_summary TEXT, -- Résumé auto-généré
  action_items TEXT[], -- Actions à suivre
  member_info JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================
-- 💰 TABLE: jarvis_cost_tracking (Suivi Coûts Précis)
-- ====================================

CREATE TABLE IF NOT EXISTS jarvis_cost_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  kiosk_slug TEXT NOT NULL,
  
  -- 📅 Période
  date DATE NOT NULL,
  hour INTEGER CHECK (hour BETWEEN 0 AND 23),
  
  -- 🤖 Utilisation IA
  total_sessions INTEGER DEFAULT 0,
  successful_sessions INTEGER DEFAULT 0,
  failed_sessions INTEGER DEFAULT 0,
  
  -- 💰 Coûts Détaillés
  total_cost_usd DECIMAL(10,6) DEFAULT 0,
  input_tokens_cost_usd DECIMAL(10,6) DEFAULT 0,
  output_tokens_cost_usd DECIMAL(10,6) DEFAULT 0,
  realtime_api_cost_usd DECIMAL(10,6) DEFAULT 0, -- Coût spécifique real-time
  
  -- 📊 Tokens Consommés
  total_input_tokens BIGINT DEFAULT 0,
  total_output_tokens BIGINT DEFAULT 0,
  avg_tokens_per_session DECIMAL(10,2),
  
  -- ⚡ Performance
  avg_response_time_ms INTEGER,
  max_response_time_ms INTEGER,
  min_response_time_ms INTEGER,
  
  -- 🎯 Modèles Utilisés
  models_used JSONB DEFAULT '{}'::jsonb, -- {"gpt-4o": 15, "gpt-4": 3}
  
  -- 📈 Métadonnées
  peak_hour_sessions INTEGER,
  cost_per_session_avg_usd DECIMAL(8,4),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contrainte unique par gym/date/heure
  UNIQUE(gym_id, date, hour)
);

-- ====================================
-- 📊 INDEXES POUR PERFORMANCE
-- ====================================

-- Indexes jarvis_ai_metrics
CREATE INDEX IF NOT EXISTS idx_jarvis_ai_metrics_gym_id ON jarvis_ai_metrics(gym_id);
CREATE INDEX IF NOT EXISTS idx_jarvis_ai_metrics_started_at ON jarvis_ai_metrics(started_at);
CREATE INDEX IF NOT EXISTS idx_jarvis_ai_metrics_model ON jarvis_ai_metrics(ai_model);
CREATE INDEX IF NOT EXISTS idx_jarvis_ai_metrics_session_id ON jarvis_ai_metrics(session_id);

-- Indexes webrtc_metrics
CREATE INDEX IF NOT EXISTS idx_jarvis_webrtc_metrics_gym_id ON jarvis_webrtc_metrics(gym_id);
CREATE INDEX IF NOT EXISTS idx_jarvis_webrtc_metrics_measured_at ON jarvis_webrtc_metrics(measured_at);
CREATE INDEX IF NOT EXISTS idx_jarvis_webrtc_metrics_session_id ON jarvis_webrtc_metrics(session_id);

-- Indexes user_interactions
CREATE INDEX IF NOT EXISTS idx_jarvis_user_interactions_gym_id ON jarvis_user_interactions(gym_id);
CREATE INDEX IF NOT EXISTS idx_jarvis_user_interactions_started_at ON jarvis_user_interactions(session_started_at);
CREATE INDEX IF NOT EXISTS idx_jarvis_user_interactions_member_badge ON jarvis_user_interactions(member_badge_id);
CREATE INDEX IF NOT EXISTS idx_jarvis_user_interactions_session_id ON jarvis_user_interactions(session_id);

-- Indexes cost_tracking
CREATE INDEX IF NOT EXISTS idx_jarvis_cost_tracking_gym_date ON jarvis_cost_tracking(gym_id, date);
CREATE INDEX IF NOT EXISTS idx_jarvis_cost_tracking_date_hour ON jarvis_cost_tracking(date, hour);

-- ====================================
-- 🔒 ROW LEVEL SECURITY
-- ====================================

-- Activer RLS
ALTER TABLE jarvis_ai_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_webrtc_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_cost_tracking ENABLE ROW LEVEL SECURITY;

-- Politiques d'accès
CREATE POLICY "Allow all operations on jarvis_ai_metrics" ON jarvis_ai_metrics FOR ALL USING (true);
CREATE POLICY "Allow all operations on jarvis_webrtc_metrics" ON jarvis_webrtc_metrics FOR ALL USING (true);
CREATE POLICY "Allow all operations on jarvis_user_interactions" ON jarvis_user_interactions FOR ALL USING (true);
CREATE POLICY "Allow all operations on jarvis_cost_tracking" ON jarvis_cost_tracking FOR ALL USING (true);

-- ====================================
-- 🤖 TRIGGERS
-- ====================================

-- Trigger pour updated_at
CREATE TRIGGER update_jarvis_user_interactions_updated_at
  BEFORE UPDATE ON jarvis_user_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jarvis_cost_tracking_updated_at
  BEFORE UPDATE ON jarvis_cost_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- 👁️ VUES DASHBOARD JARVIS
-- ====================================

-- Vue monitoring IA temps réel
CREATE OR REPLACE VIEW v_jarvis_ai_status AS
SELECT 
  g.id as gym_id,
  g.name as gym_name,
  g.kiosk_config->>'kiosk_url_slug' as kiosk_slug,
  
  -- Sessions dernière heure
  (SELECT COUNT(*) FROM jarvis_ai_metrics jam 
   WHERE jam.gym_id = g.id 
   AND jam.started_at > now() - INTERVAL '1 hour') as sessions_last_hour,
   
  -- Performance IA récente
  (SELECT AVG(jam.api_response_time_ms) FROM jarvis_ai_metrics jam 
   WHERE jam.gym_id = g.id 
   AND jam.started_at > now() - INTERVAL '1 hour') as avg_response_time_ms,
   
  -- Coût aujourd'hui
  (SELECT SUM(jam.cost_usd) FROM jarvis_ai_metrics jam 
   WHERE jam.gym_id = g.id 
   AND jam.started_at::date = CURRENT_DATE) as cost_today_usd,
   
  -- Taux de succès récent
  (SELECT 
    (COUNT(CASE WHEN jam.conversation_success THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0))
   FROM jarvis_ai_metrics jam 
   WHERE jam.gym_id = g.id 
   AND jam.started_at > now() - INTERVAL '24 hours') as success_rate_24h,
   
  -- Erreurs récentes
  (SELECT COUNT(*) FROM jarvis_ai_metrics jam 
   WHERE jam.gym_id = g.id 
   AND jam.error_occurred = true
   AND jam.started_at > now() - INTERVAL '1 hour') as errors_last_hour,
   
  -- Qualité WebRTC moyenne
  (SELECT AVG(jwm.audio_quality_score) FROM jarvis_webrtc_metrics jwm 
   WHERE jwm.gym_id = g.id 
   AND jwm.measured_at > now() - INTERVAL '1 hour') as avg_audio_quality,
   
  -- Satisfaction utilisateurs récente
  (SELECT AVG(jui.satisfaction_rating) FROM jarvis_user_interactions jui 
   WHERE jui.gym_id = g.id 
   AND jui.session_started_at > now() - INTERVAL '24 hours'
   AND jui.satisfaction_rating IS NOT NULL) as avg_satisfaction_24h

FROM gyms g
WHERE g.kiosk_config->>'kiosk_url_slug' IS NOT NULL;

-- ====================================
-- ✅ VALIDATION
-- ====================================

SELECT 
  '🤖 MONITORING JARVIS SPÉCIFIQUE CRÉÉ!' as result,
  'Tables: jarvis_ai_metrics, jarvis_webrtc_metrics, jarvis_user_interactions, jarvis_cost_tracking' as tables_created,
  'Vue: v_jarvis_ai_status' as view_created,
  now() as created_at;