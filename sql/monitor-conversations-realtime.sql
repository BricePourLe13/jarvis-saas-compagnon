-- ===============================================
-- MONITORING CONVERSATIONS TEMPS RÉEL
-- ===============================================

-- 🎤 1. DERNIÈRES CONVERSATIONS (à rafraîchir pendant les tests)
SELECT 
  jcl.timestamp,
  gm.first_name,
  gm.last_name,
  jcl.speaker,
  LEFT(jcl.message_text, 100) as message_preview,
  jcl.detected_intent,
  jcl.sentiment_score,
  jcl.topic_category,
  jcl.user_engagement_level,
  jcl.contains_complaint,
  jcl.contains_feedback,
  jcl.conversation_turn_number
FROM jarvis_conversation_logs jcl
LEFT JOIN gym_members gm ON jcl.member_id = gm.id
ORDER BY jcl.timestamp DESC
LIMIT 20;

-- 📊 2. SESSIONS ACTIVES
SELECT 
  ors.session_id,
  ors.session_started_at,
  ors.member_name,
  ors.kiosk_slug,
  ors.session_metadata->>'status' as status,
  COUNT(jcl.id) as total_interactions,
  MAX(jcl.timestamp) as last_interaction
FROM openai_realtime_sessions ors
LEFT JOIN jarvis_conversation_logs jcl ON ors.session_id = jcl.session_id
WHERE ors.session_ended_at IS NULL
  AND ors.session_started_at > NOW() - INTERVAL '2 hours'
GROUP BY ors.session_id, ors.session_started_at, ors.member_name, ors.kiosk_slug, ors.session_metadata
ORDER BY ors.session_started_at DESC;

-- 🧠 3. ENRICHISSEMENT PROFIL EN TEMPS RÉEL
SELECT 
  gm.first_name,
  gm.last_name,
  gm.fitness_goals,
  gm.favorite_equipment,
  gm.communication_style,
  gm.jarvis_personalization_score,
  gm.last_profile_update,
  COUNT(jcl.id) as total_conversations
FROM gym_members gm
LEFT JOIN jarvis_conversation_logs jcl ON gm.id = jcl.member_id
WHERE gm.last_profile_update > NOW() - INTERVAL '1 hour'
GROUP BY gm.id, gm.first_name, gm.last_name, gm.fitness_goals, 
         gm.favorite_equipment, gm.communication_style, 
         gm.jarvis_personalization_score, gm.last_profile_update
ORDER BY gm.last_profile_update DESC;

-- 🚨 4. ALERTES GÉNÉRÉES
SELECT 
  jcl.timestamp,
  gm.first_name,
  jcl.message_text,
  jcl.detected_intent,
  jcl.sentiment_score,
  CASE 
    WHEN jcl.contains_complaint THEN 'COMPLAINT'
    WHEN jcl.needs_human_review THEN 'NEEDS_REVIEW'
    WHEN jcl.sentiment_score < -0.5 THEN 'NEGATIVE_SENTIMENT'
    ELSE 'INFO'
  END as alert_type
FROM jarvis_conversation_logs jcl
LEFT JOIN gym_members gm ON jcl.member_id = gm.id
WHERE jcl.timestamp > NOW() - INTERVAL '1 hour'
  AND (jcl.contains_complaint = true 
       OR jcl.needs_human_review = true 
       OR jcl.sentiment_score < -0.3)
ORDER BY jcl.timestamp DESC;

-- 📈 5. ANALYTICS TEMPS RÉEL
SELECT 
  DATE_TRUNC('hour', jcl.timestamp) as hour,
  COUNT(*) as total_interactions,
  COUNT(DISTINCT jcl.member_id) as unique_members,
  COUNT(CASE WHEN jcl.speaker = 'user' THEN 1 END) as user_messages,
  COUNT(CASE WHEN jcl.speaker = 'jarvis' THEN 1 END) as jarvis_responses,
  AVG(jcl.sentiment_score) as avg_sentiment,
  COUNT(CASE WHEN jcl.contains_complaint THEN 1 END) as complaints,
  COUNT(CASE WHEN jcl.user_engagement_level = 'high' THEN 1 END) as high_engagement
FROM jarvis_conversation_logs jcl
WHERE jcl.timestamp > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', jcl.timestamp)
ORDER BY hour DESC;

-- 🎯 6. PROFIL D'UN MEMBRE SPÉCIFIQUE (pour debug)
-- Remplace 'BADGE_ID_HERE' par le badge que tu testes
SELECT 
  -- Infos de base
  gm.first_name,
  gm.last_name,
  gm.badge_id,
  gm.fitness_level,
  gm.engagement_level,
  gm.jarvis_personalization_score,
  
  -- Préférences détectées
  gm.fitness_goals,
  gm.favorite_equipment,
  gm.communication_style,
  gm.current_goals,
  
  -- Stats conversations
  COUNT(jcl.id) as total_conversations,
  AVG(jcl.sentiment_score) as avg_sentiment,
  MAX(jcl.timestamp) as last_conversation
FROM gym_members gm
LEFT JOIN jarvis_conversation_logs jcl ON gm.id = jcl.member_id
WHERE gm.badge_id = 'BADGE_ID_HERE' -- ⚠️ REMPLACER
GROUP BY gm.id, gm.first_name, gm.last_name, gm.badge_id, 
         gm.fitness_level, gm.engagement_level, gm.jarvis_personalization_score,
         gm.fitness_goals, gm.favorite_equipment, gm.communication_style, gm.current_goals;

-- 🔄 7. QUERY DE REFRESH RAPIDE (à exécuter pendant les tests)
SELECT 
  'DERNIÈRE ACTIVITÉ' as type,
  jcl.timestamp,
  COALESCE(gm.first_name, 'Anonyme') as membre,
  jcl.speaker,
  LEFT(jcl.message_text, 80) as message,
  jcl.detected_intent,
  ROUND(jcl.sentiment_score::numeric, 2) as sentiment
FROM jarvis_conversation_logs jcl
LEFT JOIN gym_members gm ON jcl.member_id = gm.id
WHERE jcl.timestamp > NOW() - INTERVAL '5 minutes'
ORDER BY jcl.timestamp DESC
LIMIT 10;

