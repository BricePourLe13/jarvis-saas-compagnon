-- ===============================================
-- MONITORING SPÉCIFIQUE POUR TES TESTS
-- ===============================================

-- 🎯 TES BADGES POUR TESTS :
-- BADGE_003 (Alex) - Expert, communication directe
-- BADGE_001 (Pierre) - Régulier, communication amicale  
-- BADGE_002 (Sophie) - Sociale, communication motivante
-- BADGE0002 (Thomas) - Débutant, besoin d'encouragement
-- BADGE0001 (Marie) - Nouvelle, très encourageant

-- 🔍 1. ÉTAT DES PROFILS ENRICHIS
SELECT 
  badge_id,
  first_name,
  fitness_level,
  communication_style,
  jarvis_personalization_score,
  profile_completeness_percent,
  engagement_level
FROM gym_members 
WHERE badge_id IN ('BADGE_003', 'BADGE_001', 'BADGE_002', 'BADGE0002', 'BADGE0001')
ORDER BY jarvis_personalization_score DESC;

-- 🎤 2. MONITORING CONVERSATIONS EN TEMPS RÉEL 
-- (à rafraîchir pendant tes tests)
SELECT 
  jcl.timestamp,
  gm.first_name || ' (' || gm.badge_id || ')' as membre,
  jcl.speaker,
  LEFT(jcl.message_text, 120) as message,
  jcl.detected_intent,
  ROUND(jcl.sentiment_score::numeric, 2) as sentiment,
  jcl.topic_category,
  jcl.user_engagement_level,
  jcl.conversation_turn_number
FROM jarvis_conversation_logs jcl
JOIN gym_members gm ON jcl.member_id = gm.id
WHERE gm.badge_id IN ('BADGE_003', 'BADGE_001', 'BADGE_002', 'BADGE0002', 'BADGE0001')
ORDER BY jcl.timestamp DESC
LIMIT 20;

-- 📊 3. SESSIONS ACTIVES DE TES MEMBRES
SELECT 
  ors.session_id,
  ors.member_name,
  ors.kiosk_slug,
  ors.session_started_at,
  ors.session_metadata->>'status' as status,
  COUNT(jcl.id) as interactions,
  MAX(jcl.timestamp) as derniere_interaction
FROM openai_realtime_sessions ors
LEFT JOIN jarvis_conversation_logs jcl ON ors.session_id = jcl.session_id
LEFT JOIN gym_members gm ON ors.member_id = gm.id
WHERE gm.badge_id IN ('BADGE_003', 'BADGE_001', 'BADGE_002', 'BADGE0002', 'BADGE0001')
  AND ors.session_started_at > NOW() - INTERVAL '2 hours'
GROUP BY ors.session_id, ors.member_name, ors.kiosk_slug, ors.session_started_at, ors.session_metadata
ORDER BY ors.session_started_at DESC;

-- 🧠 4. ENRICHISSEMENT AUTOMATIQUE DÉTECTÉ
SELECT 
  gm.first_name,
  gm.badge_id,
  gm.fitness_goals,
  gm.favorite_equipment, 
  gm.communication_style,
  gm.jarvis_personalization_score,
  gm.last_profile_update,
  COUNT(jcl.id) as conversations_total
FROM gym_members gm
LEFT JOIN jarvis_conversation_logs jcl ON gm.id = jcl.member_id
WHERE gm.badge_id IN ('BADGE_003', 'BADGE_001', 'BADGE_002', 'BADGE0002', 'BADGE0001')
GROUP BY gm.id, gm.first_name, gm.badge_id, gm.fitness_goals, gm.favorite_equipment, 
         gm.communication_style, gm.jarvis_personalization_score, gm.last_profile_update
ORDER BY gm.last_profile_update DESC;

-- 🚨 5. ALERTES SPÉCIFIQUES À TES TESTS
SELECT 
  jcl.timestamp,
  gm.first_name || ' (' || gm.badge_id || ')' as membre,
  jcl.message_text,
  jcl.detected_intent,
  ROUND(jcl.sentiment_score::numeric, 2) as sentiment,
  CASE 
    WHEN jcl.contains_complaint THEN '⚠️ PLAINTE'
    WHEN jcl.needs_human_review THEN '👁️ À VÉRIFIER'
    WHEN jcl.sentiment_score < -0.5 THEN '😞 NÉGATIF'
    WHEN jcl.sentiment_score > 0.5 THEN '😊 POSITIF'
    ELSE '📝 INFO'
  END as type_alerte
FROM jarvis_conversation_logs jcl
JOIN gym_members gm ON jcl.member_id = gm.id
WHERE gm.badge_id IN ('BADGE_003', 'BADGE_001', 'BADGE_002', 'BADGE0002', 'BADGE0001')
  AND jcl.timestamp > NOW() - INTERVAL '1 hour'
ORDER BY jcl.timestamp DESC;

-- 🎭 6. ANALYSE PAR PROFIL CONVERSATIONNEL
SELECT 
  gm.communication_style,
  COUNT(jcl.id) as total_interactions,
  AVG(jcl.sentiment_score) as sentiment_moyen,
  COUNT(CASE WHEN jcl.user_engagement_level = 'high' THEN 1 END) as high_engagement,
  COUNT(CASE WHEN jcl.contains_complaint THEN 1 END) as plaintes
FROM gym_members gm
LEFT JOIN jarvis_conversation_logs jcl ON gm.id = jcl.member_id
WHERE gm.badge_id IN ('BADGE_003', 'BADGE_001', 'BADGE_002', 'BADGE0002', 'BADGE0001')
  AND jcl.timestamp > NOW() - INTERVAL '24 hours'
GROUP BY gm.communication_style
ORDER BY total_interactions DESC;

-- ⚡ 7. REFRESH RAPIDE (à exécuter pendant les tests)
SELECT 
  '🔄 DERNIÈRE ACTIVITÉ' as status,
  jcl.timestamp,
  gm.first_name as membre,
  gm.badge_id,
  jcl.speaker,
  LEFT(jcl.message_text, 100) as message,
  jcl.detected_intent,
  CASE 
    WHEN jcl.sentiment_score > 0.3 THEN '😊'
    WHEN jcl.sentiment_score < -0.3 THEN '😞'
    ELSE '😐'
  END as sentiment_emoji
FROM jarvis_conversation_logs jcl
JOIN gym_members gm ON jcl.member_id = gm.id
WHERE gm.badge_id IN ('BADGE_003', 'BADGE_001', 'BADGE_002', 'BADGE0002', 'BADGE0001')
  AND jcl.timestamp > NOW() - INTERVAL '5 minutes'
ORDER BY jcl.timestamp DESC
LIMIT 5;

-- 🎯 8. FOCUS SUR UN BADGE SPÉCIFIQUE (modifie le badge selon tes tests)
SELECT 
  '👤 PROFIL COMPLET' as section,
  gm.first_name,
  gm.fitness_level,
  gm.communication_style,
  gm.jarvis_personalization_score,
  gm.fitness_goals,
  gm.favorite_equipment
FROM gym_members gm
WHERE gm.badge_id = 'BADGE0002' -- ⚠️ CHANGE LE BADGE SELON TON TEST

UNION ALL

SELECT 
  '💬 CONVERSATIONS RÉCENTES' as section,
  LEFT(jcl.message_text, 80),
  jcl.speaker,
  jcl.detected_intent,
  jcl.sentiment_score::text,
  NULL,
  NULL
FROM jarvis_conversation_logs jcl
JOIN gym_members gm ON jcl.member_id = gm.id
WHERE gm.badge_id = 'BADGE0002' -- ⚠️ CHANGE LE BADGE SELON TON TEST
ORDER BY section DESC, jcl.timestamp DESC
LIMIT 10;

