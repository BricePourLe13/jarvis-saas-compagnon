-- 🔍 AUDIT SCHEMA COMPLET - DIAGNOSTIC MONITORING JARVIS
-- Comparaison entre schema Supabase actuel et code TypeScript attendu

-- ====================================
-- 📊 AUDIT TABLE: openai_realtime_sessions
-- ====================================

-- 1. Vérifier si la table existe
SELECT 
  table_name,
  table_type,
  table_catalog,
  table_schema
FROM information_schema.tables 
WHERE table_name = 'openai_realtime_sessions';

-- 2. Lister TOUTES les colonnes actuelles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length,
  numeric_precision,
  numeric_scale,
  ordinal_position
FROM information_schema.columns 
WHERE table_name = 'openai_realtime_sessions'
ORDER BY ordinal_position;

-- 3. Vérifier contraintes et index
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  tc.table_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'openai_realtime_sessions';

-- ====================================
-- 🔒 AUDIT RLS POLICIES
-- ====================================

-- 4. Lister toutes les policies RLS actuelles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'openai_realtime_sessions';

-- 5. Vérifier si RLS est activé
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'openai_realtime_sessions';

-- ====================================
-- 📋 COLONNES ATTENDUES PAR LE CODE
-- ====================================

/*
D'après l'analyse du code TypeScript, ces colonnes DOIVENT exister :

COLONNES CRITIQUES MANQUANTES :
- input_audio_tokens_cost_usd (DECIMAL)
- output_audio_tokens_cost_usd (DECIMAL) 
- input_text_tokens_cost_usd (DECIMAL)
- output_text_tokens_cost_usd (DECIMAL)

COLONNES EXISTANTES PROBABLES :
- id (UUID PRIMARY KEY)
- session_id (TEXT NOT NULL)
- gym_id (UUID REFERENCES gyms)
- session_started_at (TIMESTAMPTZ)
- session_ended_at (TIMESTAMPTZ)
- total_input_tokens (INTEGER)
- total_output_tokens (INTEGER)
- total_cost_usd (DECIMAL)

COLONNES À VÉRIFIER :
- total_input_audio_tokens (INTEGER)
- total_output_audio_tokens (INTEGER)
- session_duration_seconds (INTEGER)
- total_user_turns (INTEGER)
- total_ai_turns (INTEGER)
- total_interruptions (INTEGER)
*/

-- ====================================
-- 🎯 DIAGNOSTIC COMPLET
-- ====================================

-- 6. Test d'insertion simulée (rollback)
BEGIN;
DO $$
BEGIN
  -- Tenter d'insérer une session test pour identifier colonnes manquantes
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
    'test_session_audit',
    '00000000-0000-0000-0000-000000000000',
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
  
  RAISE NOTICE '✅ Test insertion réussie - Toutes colonnes présentes';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Erreur insertion test: %', SQLERRM;
END $$;
ROLLBACK;

-- 7. Vérifier permissions utilisateur actuel
SELECT 
  table_name,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'openai_realtime_sessions'
  AND grantee = current_user;

-- ====================================
-- 📊 RÉSULTAT ATTENDU
-- ====================================

/*
Ce script va révéler :
1. ✅ Colonnes présentes
2. ❌ Colonnes manquantes 
3. 🔒 Problèmes RLS
4. 🚨 Erreurs de permissions
5. 📋 Plan de migration exact
*/