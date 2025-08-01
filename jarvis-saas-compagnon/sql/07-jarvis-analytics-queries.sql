-- 🤖 REQUÊTES ANALYTICS JARVIS - IA, Sessions, Coûts
-- Analyses spécifiques pour monitoring JARVIS

-- ====================================
-- 💰 ANALYSE COÛTS OPENAI TEMPS RÉEL
-- ====================================

-- Coûts par kiosk aujourd'hui
SELECT 
  '💰 COÛTS AUJOURD''HUI' as section,
  g.name as gym_name,
  g.kiosk_config->>'kiosk_url_slug' as kiosk_slug,
  
  -- Sessions et coûts
  COUNT(jam.id) as sessions_count,
  SUM(jam.cost_usd)::DECIMAL(8,4) as total_cost_usd,
  AVG(jam.cost_usd)::DECIMAL(6,4) as avg_cost_per_session,
  
  -- Tokens consommés
  SUM(jam.tokens_input) as total_input_tokens,
  SUM(jam.tokens_output) as total_output_tokens,
  
  -- Performance
  AVG(jam.api_response_time_ms)::INTEGER as avg_response_time_ms,
  COUNT(CASE WHEN jam.error_occurred THEN 1 END) as errors_count,
  
  -- Modèles utilisés
  string_agg(DISTINCT jam.ai_model, ', ') as models_used

FROM gyms g
LEFT JOIN jarvis_ai_metrics jam ON g.id = jam.gym_id 
  AND jam.started_at::date = CURRENT_DATE
WHERE g.kiosk_config->>'kiosk_url_slug' IS NOT NULL
GROUP BY g.id, g.name, g.kiosk_config->>'kiosk_url_slug'
ORDER BY total_cost_usd DESC NULLS LAST;

-- ====================================
-- 📊 PERFORMANCE IA PAR MODÈLE
-- ====================================

-- Comparaison performance par modèle IA
SELECT 
  '🤖 PERFORMANCE PAR MODÈLE' as section,
  jam.ai_model,
  
  -- Utilisation
  COUNT(*) as sessions_count,
  COUNT(DISTINCT jam.gym_id) as kiosks_using,
  
  -- Performance
  AVG(jam.api_response_time_ms)::INTEGER as avg_response_time_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY jam.api_response_time_ms) as p95_response_time_ms,
  
  -- Coûts
  SUM(jam.cost_usd)::DECIMAL(8,4) as total_cost_usd,
  AVG(jam.cost_usd)::DECIMAL(6,4) as avg_cost_per_session,
  
  -- Qualité
  AVG(jam.tokens_output::DECIMAL / NULLIF(jam.tokens_input, 0))::DECIMAL(4,2) as avg_output_input_ratio,
  COUNT(CASE WHEN jam.conversation_success THEN 1 END) * 100.0 / COUNT(*) as success_rate,
  
  -- Erreurs
  COUNT(CASE WHEN jam.error_occurred THEN 1 END) as errors_count,
  COUNT(CASE WHEN jam.error_occurred THEN 1 END) * 100.0 / COUNT(*) as error_rate

FROM jarvis_ai_metrics jam
WHERE jam.started_at > now() - INTERVAL '7 days'
GROUP BY jam.ai_model
ORDER BY sessions_count DESC;

-- ====================================
-- 🎙️ QUALITÉ WEBRTC & AUDIO
-- ====================================

-- Analyse qualité audio par kiosk
SELECT 
  '🎙️ QUALITÉ AUDIO' as section,
  g.name as gym_name,
  jwm.kiosk_slug,
  
  -- Qualité audio moyenne
  AVG(jwm.audio_quality_score)::DECIMAL(3,2) as avg_audio_quality,
  AVG(jwm.audio_input_level)::DECIMAL(5,2) as avg_input_level,
  AVG(jwm.audio_output_level)::DECIMAL(5,2) as avg_output_level,
  
  -- Connexion WebRTC
  AVG(jwm.rtt_ms)::INTEGER as avg_rtt_ms,
  AVG(jwm.packets_lost) as avg_packets_lost,
  AVG(jwm.jitter_ms)::DECIMAL(6,2) as avg_jitter_ms,
  
  -- Reconnaissance vocale
  AVG(jwm.speech_recognition_accuracy)::DECIMAL(5,2) as avg_speech_accuracy,
  AVG(jwm.speech_interruptions) as avg_interruptions,
  
  -- Problèmes détectés
  COUNT(CASE WHEN jwm.echo_detected THEN 1 END) as echo_sessions,
  AVG(jwm.audio_dropouts) as avg_dropouts,
  
  -- Distribution qualité connexion
  COUNT(CASE WHEN jwm.connection_quality = 'excellent' THEN 1 END) as excellent_connections,
  COUNT(CASE WHEN jwm.connection_quality = 'good' THEN 1 END) as good_connections,
  COUNT(CASE WHEN jwm.connection_quality = 'fair' THEN 1 END) as fair_connections,
  COUNT(CASE WHEN jwm.connection_quality = 'poor' THEN 1 END) as poor_connections

FROM gyms g
LEFT JOIN jarvis_webrtc_metrics jwm ON g.id = jwm.gym_id 
  AND jwm.measured_at > now() - INTERVAL '24 hours'
WHERE g.kiosk_config->>'kiosk_url_slug' IS NOT NULL
GROUP BY g.id, g.name, jwm.kiosk_slug
HAVING COUNT(jwm.id) > 0
ORDER BY avg_audio_quality DESC;

-- ====================================
-- 👥 ANALYSE INTERACTIONS UTILISATEURS
-- ====================================

-- Comportement utilisateurs par kiosk
SELECT 
  '👥 INTERACTIONS UTILISATEURS' as section,
  g.name as gym_name,
  jui.kiosk_slug,
  
  -- Volume sessions
  COUNT(jui.id) as total_interactions,
  COUNT(DISTINCT jui.member_badge_id) as unique_users,
  COUNT(CASE WHEN jui.is_returning_user THEN 1 END) as returning_users,
  
  -- Types d'interactions
  COUNT(CASE WHEN jui.member_type = 'member' THEN 1 END) as member_interactions,
  COUNT(CASE WHEN jui.member_type = 'visitor' THEN 1 END) as visitor_interactions,
  COUNT(CASE WHEN jui.member_type = 'staff' THEN 1 END) as staff_interactions,
  
  -- Durée sessions
  AVG(jui.total_duration_seconds)::INTEGER as avg_duration_seconds,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY jui.total_duration_seconds) as median_duration_seconds,
  
  -- Répartition temps de parole
  AVG(jui.user_talk_time_seconds)::INTEGER as avg_user_talk_time,
  AVG(jui.jarvis_talk_time_seconds)::INTEGER as avg_jarvis_talk_time,
  
  -- Satisfaction
  AVG(jui.satisfaction_rating)::DECIMAL(3,2) as avg_satisfaction,
  AVG(jui.nps_score)::DECIMAL(4,2) as avg_nps,
  AVG(jui.final_sentiment)::DECIMAL(3,2) as avg_final_sentiment,
  
  -- Taux de succès
  COUNT(CASE WHEN jui.session_completed THEN 1 END) * 100.0 / COUNT(*) as completion_rate,
  COUNT(CASE WHEN jui.user_goal_achieved THEN 1 END) * 100.0 / COUNT(*) as goal_achievement_rate,
  COUNT(CASE WHEN jui.escalation_required THEN 1 END) as escalations_needed,
  
  -- Raisons de fin
  COUNT(CASE WHEN jui.end_reason = 'user_satisfied' THEN 1 END) as ended_satisfied,
  COUNT(CASE WHEN jui.end_reason = 'user_frustrated' THEN 1 END) as ended_frustrated,
  COUNT(CASE WHEN jui.end_reason = 'technical_error' THEN 1 END) as ended_technical_error

FROM gyms g
LEFT JOIN jarvis_user_interactions jui ON g.id = jui.gym_id 
  AND jui.session_started_at > now() - INTERVAL '7 days'
WHERE g.kiosk_config->>'kiosk_url_slug' IS NOT NULL
GROUP BY g.id, g.name, jui.kiosk_slug
HAVING COUNT(jui.id) > 0
ORDER BY total_interactions DESC;

-- ====================================
-- 🔥 TOP PROBLÈMES JARVIS
-- ====================================

-- Erreurs IA les plus fréquentes
SELECT 
  '🚨 TOP ERREURS IA' as section,
  jam.error_type,
  COUNT(*) as error_count,
  COUNT(DISTINCT jam.gym_id) as affected_kiosks,
  AVG(jam.retry_count)::DECIMAL(3,1) as avg_retries,
  
  -- Échantillon message d'erreur
  (SELECT jam2.error_message FROM jarvis_ai_metrics jam2 
   WHERE jam2.error_type = jam.error_type 
   AND jam2.error_message IS NOT NULL
   ORDER BY jam2.started_at DESC LIMIT 1) as sample_error_message,
   
  MAX(jam.started_at) as last_occurrence

FROM jarvis_ai_metrics jam
WHERE jam.error_occurred = true
AND jam.started_at > now() - INTERVAL '7 days'
GROUP BY jam.error_type
ORDER BY error_count DESC
LIMIT 10;

-- ====================================
-- 📈 TRENDS JOURNALIERS
-- ====================================

-- Évolution métriques par jour (7 derniers jours)
SELECT 
  '📈 TRENDS 7 JOURS' as section,
  DATE(jam.started_at) as date,
  
  -- Volume
  COUNT(jam.id) as total_sessions,
  COUNT(DISTINCT jam.gym_id) as active_kiosks,
  COUNT(DISTINCT jam.ai_model) as models_used,
  
  -- Performance
  AVG(jam.api_response_time_ms)::INTEGER as avg_response_time_ms,
  COUNT(CASE WHEN jam.conversation_success THEN 1 END) * 100.0 / COUNT(*) as success_rate,
  
  -- Coûts
  SUM(jam.cost_usd)::DECIMAL(8,4) as total_cost_usd,
  AVG(jam.cost_usd)::DECIMAL(6,4) as avg_cost_per_session,
  
  -- Tokens
  SUM(jam.tokens_input) as total_input_tokens,
  SUM(jam.tokens_output) as total_output_tokens,
  
  -- Erreurs
  COUNT(CASE WHEN jam.error_occurred THEN 1 END) as errors_count,
  COUNT(CASE WHEN jam.error_occurred THEN 1 END) * 100.0 / COUNT(*) as error_rate

FROM jarvis_ai_metrics jam
WHERE jam.started_at > now() - INTERVAL '7 days'
GROUP BY DATE(jam.started_at)
ORDER BY date DESC;

-- ====================================
-- 🎯 INTENTS & SUJETS POPULAIRES
-- ====================================

-- Analyse des demandes utilisateurs
SELECT 
  '🎯 INTENTS POPULAIRES' as section,
  unnest(jui.intent_detected) as intent,
  COUNT(*) as frequency,
  COUNT(DISTINCT jui.gym_id) as kiosks_count,
  
  -- Satisfaction pour cet intent
  AVG(jui.satisfaction_rating)::DECIMAL(3,2) as avg_satisfaction,
  COUNT(CASE WHEN jui.user_goal_achieved THEN 1 END) * 100.0 / COUNT(*) as success_rate,
  
  -- Durée moyenne pour cet intent
  AVG(jui.total_duration_seconds)::INTEGER as avg_duration_seconds

FROM jarvis_user_interactions jui
WHERE jui.session_started_at > now() - INTERVAL '7 days'
AND array_length(jui.intent_detected, 1) > 0
GROUP BY unnest(jui.intent_detected)
ORDER BY frequency DESC
LIMIT 15;

-- ====================================
-- ⏰ ANALYSE TEMPORELLE
-- ====================================

-- Utilisation par heure de la journée
SELECT 
  '⏰ UTILISATION PAR HEURE' as section,
  EXTRACT(HOUR FROM jam.started_at) as hour,
  COUNT(jam.id) as sessions_count,
  AVG(jam.api_response_time_ms)::INTEGER as avg_response_time_ms,
  SUM(jam.cost_usd)::DECIMAL(8,4) as total_cost_usd,
  COUNT(CASE WHEN jam.conversation_success THEN 1 END) * 100.0 / COUNT(*) as success_rate

FROM jarvis_ai_metrics jam
WHERE jam.started_at > now() - INTERVAL '7 days'
GROUP BY EXTRACT(HOUR FROM jam.started_at)
ORDER BY hour;

-- ====================================
-- 🏆 CLASSEMENT KIOSKS PERFORMANCE
-- ====================================

-- Ranking kiosks par performance globale
SELECT 
  '🏆 PERFORMANCE KIOSKS' as section,
  g.name as gym_name,
  jam.kiosk_slug,
  
  -- Score composite (pondéré)
  (
    (COUNT(CASE WHEN jam.conversation_success THEN 1 END) * 100.0 / NULLIF(COUNT(jam.id), 0)) * 0.4 + -- 40% succès
    (CASE WHEN AVG(jam.api_response_time_ms) < 2000 THEN 100 
          WHEN AVG(jam.api_response_time_ms) < 3000 THEN 80
          WHEN AVG(jam.api_response_time_ms) < 5000 THEN 60
          ELSE 40 END) * 0.3 + -- 30% rapidité
    (COALESCE(AVG(jui.satisfaction_rating), 3) * 20) * 0.3 -- 30% satisfaction
  )::DECIMAL(5,2) as performance_score,
  
  -- Détails
  COUNT(jam.id) as total_sessions,
  COUNT(CASE WHEN jam.conversation_success THEN 1 END) * 100.0 / NULLIF(COUNT(jam.id), 0) as success_rate,
  AVG(jam.api_response_time_ms)::INTEGER as avg_response_time_ms,
  AVG(jui.satisfaction_rating)::DECIMAL(3,2) as avg_satisfaction,
  SUM(jam.cost_usd)::DECIMAL(8,4) as total_cost_usd

FROM gyms g
LEFT JOIN jarvis_ai_metrics jam ON g.id = jam.gym_id 
  AND jam.started_at > now() - INTERVAL '7 days'
LEFT JOIN jarvis_user_interactions jui ON g.id = jui.gym_id 
  AND jui.session_started_at > now() - INTERVAL '7 days'
WHERE g.kiosk_config->>'kiosk_url_slug' IS NOT NULL
GROUP BY g.id, g.name, jam.kiosk_slug
HAVING COUNT(jam.id) > 5 -- Minimum 5 sessions pour être classé
ORDER BY performance_score DESC;