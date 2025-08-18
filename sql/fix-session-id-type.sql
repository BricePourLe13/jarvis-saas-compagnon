-- 🔧 FIX: Changer session_id de UUID vers TEXT pour supporter les sessions OpenAI
-- 
-- PROBLÈME: jarvis_conversation_logs.session_id = UUID 
-- RÉALITÉ: Sessions OpenAI = "sess_C5rsbqH1x3Kvchecgdcxc" (TEXT)
--
-- Cette migration corrige le type de données pour accepter les vrais session IDs OpenAI

BEGIN;

-- 1. Modifier le type de colonne session_id
ALTER TABLE jarvis_conversation_logs 
ALTER COLUMN session_id TYPE TEXT;

-- 2. Recréer l'index avec le nouveau type
DROP INDEX IF EXISTS idx_jarvis_logs_session_turn;
CREATE INDEX idx_jarvis_logs_session_turn ON jarvis_conversation_logs(session_id, conversation_turn_number);

-- 3. Vérifier que ça fonctionne
COMMENT ON COLUMN jarvis_conversation_logs.session_id IS 'Session ID OpenAI (format: sess_xxxxx)';

COMMIT;

-- 🧪 TEST: Vérifier la structure
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'jarvis_conversation_logs' 
  AND column_name = 'session_id';

-- ✅ Résultat attendu: session_id | text | NO
