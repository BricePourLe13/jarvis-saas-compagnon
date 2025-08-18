-- ===============================================
-- VÉRIFICATION RAPIDE : Est-ce que le logging fonctionne ?
-- ===============================================

-- 🔍 1. Y a-t-il des conversations dans les dernières 10 minutes ?
SELECT 
  '🔍 CONVERSATIONS RÉCENTES (10 min)' as check_type,
  COUNT(*) as total_logs,
  MAX(timestamp) as derniere_interaction
FROM jarvis_conversation_logs 
WHERE timestamp > NOW() - INTERVAL '10 minutes';

-- 📊 2. Sessions OpenAI récentes
SELECT 
  '📊 SESSIONS OPENAI RÉCENTES' as check_type,
  session_id,
  member_name,
  session_started_at,
  ROUND(EXTRACT(EPOCH FROM NOW() - session_started_at)) as seconds_ago
FROM openai_realtime_sessions 
WHERE session_started_at > NOW() - INTERVAL '10 minutes'
ORDER BY session_started_at DESC;

-- 🎯 3. Si logging existe, montrer le détail
SELECT 
  '🎯 DÉTAIL CONVERSATIONS' as check_type,
  timestamp,
  speaker,
  LEFT(message_text, 80) as message,
  detected_intent,
  sentiment_score,
  session_id
FROM jarvis_conversation_logs 
WHERE timestamp > NOW() - INTERVAL '10 minutes'
ORDER BY timestamp DESC
LIMIT 10;

-- ⚠️ 4. Erreurs potentielles dans les tables
SELECT 
  '⚠️ STRUCTURE TABLES OK ?' as check_type,
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name IN ('jarvis_conversation_logs', 'openai_realtime_sessions')
  AND column_name IN ('session_id', 'speaker', 'message_text', 'timestamp')
ORDER BY table_name, column_name;
