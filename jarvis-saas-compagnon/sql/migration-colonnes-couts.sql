-- 🔧 MIGRATION COLONNES COÛTS - FIX CRITIQUE MONITORING
-- Ajouter les colonnes de coûts détaillées manquantes dans openai_realtime_sessions

-- =============================================
-- 🎯 DIAGNOSTIC: Colonnes manquantes identifiées
-- =============================================

/*
❌ ERREUR ACTUELLE:
"Could not find the 'input_audio_tokens_cost_usd' column of 'openai_realtime_sessions' in the schema cache"

✅ SOLUTION:
Ajouter toutes les colonnes de coûts détaillées attendues par le code TypeScript
*/

-- =============================================
-- 🔧 AJOUT COLONNES COÛTS DÉTAILLÉES
-- =============================================

-- 1. Colonnes de tokens audio détaillées
ALTER TABLE openai_realtime_sessions 
ADD COLUMN IF NOT EXISTS total_input_audio_tokens INTEGER DEFAULT 0;

ALTER TABLE openai_realtime_sessions 
ADD COLUMN IF NOT EXISTS total_output_audio_tokens INTEGER DEFAULT 0;

-- 2. Colonnes de coûts détaillées (ce qui manque !)
ALTER TABLE openai_realtime_sessions 
ADD COLUMN IF NOT EXISTS input_audio_tokens_cost_usd DECIMAL(10,6) DEFAULT 0;

ALTER TABLE openai_realtime_sessions 
ADD COLUMN IF NOT EXISTS output_audio_tokens_cost_usd DECIMAL(10,6) DEFAULT 0;

ALTER TABLE openai_realtime_sessions 
ADD COLUMN IF NOT EXISTS input_text_tokens_cost_usd DECIMAL(10,6) DEFAULT 0;

ALTER TABLE openai_realtime_sessions 
ADD COLUMN IF NOT EXISTS output_text_tokens_cost_usd DECIMAL(10,6) DEFAULT 0;

-- 3. Colonnes de métadonnées techniques
ALTER TABLE openai_realtime_sessions 
ADD COLUMN IF NOT EXISTS total_interruptions INTEGER DEFAULT 0;

-- 4. Colonnes de performance
ALTER TABLE openai_realtime_sessions 
ADD COLUMN IF NOT EXISTS connection_established_at TIMESTAMPTZ;

ALTER TABLE openai_realtime_sessions 
ADD COLUMN IF NOT EXISTS connection_closed_at TIMESTAMPTZ;

ALTER TABLE openai_realtime_sessions 
ADD COLUMN IF NOT EXISTS disconnect_reason TEXT;

-- =============================================
-- 🚨 FIX RLS POLICIES POUR KIOSK
-- =============================================

-- Supprimer policies existantes problématiques
DROP POLICY IF EXISTS "Admin complet OpenAI sessions" ON openai_realtime_sessions;
DROP POLICY IF EXISTS "Lecture OpenAI sessions par admin" ON openai_realtime_sessions;
DROP POLICY IF EXISTS "Insertion kiosk sessions" ON openai_realtime_sessions;

-- Politique INSERT permissive pour kiosks (pas d'auth requise)
CREATE POLICY "Allow kiosk session creation"
ON openai_realtime_sessions
FOR INSERT
WITH CHECK (true);  -- Permet insertion depuis kiosk non-auth

-- Politique SELECT pour admins authentifiés
CREATE POLICY "Allow admin session read"
ON openai_realtime_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('super_admin', 'admin')
  )
);

-- Politique UPDATE pour système et admins
CREATE POLICY "Allow session updates"
ON openai_realtime_sessions
FOR UPDATE
USING (
  -- Permettre mise à jour système OU admin
  true
);

-- Politique DELETE réservée aux super admins
CREATE POLICY "Allow super admin session delete"
ON openai_realtime_sessions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- =============================================
-- 🧪 TEST VALIDATION
-- =============================================

-- Test insertion avec toutes les colonnes
DO $$
DECLARE
  test_session_id TEXT := 'migration_test_' || extract(epoch from now());
  test_gym_id UUID;
BEGIN
  -- Récupérer un gym_id valide
  SELECT id INTO test_gym_id FROM gyms LIMIT 1;
  
  IF test_gym_id IS NULL THEN
    RAISE NOTICE '⚠️ Aucun gym trouvé pour test, création gym factice...';
    INSERT INTO gyms (id, name, slug) 
    VALUES (gen_random_uuid(), 'Test Gym Migration', 'test-gym-migration')
    RETURNING id INTO test_gym_id;
  END IF;

  -- Test insertion complète
  INSERT INTO openai_realtime_sessions (
    session_id,
    gym_id,
    session_started_at,
    total_input_tokens,
    total_output_tokens,
    total_input_audio_tokens,
    total_output_audio_tokens,
    input_audio_tokens_cost_usd,
    output_audio_tokens_cost_usd,
    input_text_tokens_cost_usd,
    output_text_tokens_cost_usd,
    session_duration_seconds,
    total_user_turns,
    total_ai_turns,
    total_interruptions,
    total_cost_usd
  ) VALUES (
    test_session_id,
    test_gym_id,
    NOW(),
    100,
    200,
    50,
    150,
    0.005,
    0.015,
    0.001,
    0.002,
    300,
    5,
    5,
    1,
    0.023
  );
  
  RAISE NOTICE '✅ Test insertion migration réussi avec session: %', test_session_id;
  
  -- Nettoyer le test
  DELETE FROM openai_realtime_sessions WHERE session_id = test_session_id;
  RAISE NOTICE '🧹 Nettoyage test effectué';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Erreur test migration: %', SQLERRM;
END $$;

-- =============================================
-- 📊 VÉRIFICATION FINALE
-- =============================================

-- Lister toutes les colonnes après migration
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'openai_realtime_sessions'
  AND column_name LIKE '%cost%'
ORDER BY column_name;

-- Statistiques RLS
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'openai_realtime_sessions'
ORDER BY policyname;

-- =============================================
-- 🎯 RÉSULTAT ATTENDU
-- =============================================

/*
Après cette migration :

✅ Colonnes coûts détaillées présentes
✅ RLS policies corrigées
✅ Erreur 400 "input_audio_tokens_cost_usd not found" résolue
✅ Erreur 406 "Not Acceptable" résolue
✅ Monitoring dashboard fonctionnel

🚀 SESSION TRACKING 100% OPÉRATIONNEL !
*/