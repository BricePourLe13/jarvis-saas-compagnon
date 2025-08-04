-- 🔍 AUDIT VALEURS ENUM - DIAGNOSTIC PRÉCIS
-- Script pour identifier les valeurs enum exactes dans la base

-- =============================================
-- 🎯 OBJECTIF: Identifier valeurs enum user_role
-- =============================================

-- 1. Lister tous les types enum dans la base
SELECT 
  t.typname as enum_name,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;

-- 2. Focus sur user_role spécifiquement
SELECT 
  'user_role' as enum_type,
  enumlabel as value,
  enumsortorder as position
FROM pg_enum e
JOIN pg_type t ON t.oid = e.enumtypid
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- 3. Vérifier structure table users
SELECT 
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Échantillon données users (pour voir rôles utilisés)
SELECT 
  role,
  COUNT(*) as count
FROM users 
GROUP BY role
ORDER BY count DESC;

-- 5. Vérifier contraintes sur table users
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'users'
  AND tc.table_schema = 'public';

-- =============================================
-- 📊 AUDIT TABLE MONITORING
-- =============================================

-- 6. Vérifier existence table openai_realtime_sessions
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'openai_realtime_sessions'
  AND table_schema = 'public';

-- 7. Colonnes actuelles table monitoring (si existe)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'openai_realtime_sessions'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. Colonnes coûts spécifiquement
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'openai_realtime_sessions'
  AND column_name LIKE '%cost%'
ORDER BY column_name;

-- =============================================
-- 🔒 AUDIT RLS POLICIES
-- =============================================

-- 9. Policies actuelles sur openai_realtime_sessions
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
WHERE tablename = 'openai_realtime_sessions'
ORDER BY policyname;

-- 10. RLS activé sur la table ?
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  forcerowsecurity
FROM pg_tables 
WHERE tablename = 'openai_realtime_sessions';

-- =============================================
-- 🎯 RÉSUMÉ DIAGNOSTIC
-- =============================================

-- Message de diagnostic
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎯 ======= AUDIT ENUM TERMINÉ =======';
  RAISE NOTICE '';
  RAISE NOTICE '📊 RÉSULTATS AU-DESSUS RÉVÈLENT:';
  RAISE NOTICE '1. 🔍 Valeurs enum user_role autorisées';
  RAISE NOTICE '2. 📊 Structure table users actuelle';
  RAISE NOTICE '3. 📋 Colonnes table monitoring existantes';
  RAISE NOTICE '4. 🔒 Policies RLS actuelles';
  RAISE NOTICE '';
  RAISE NOTICE '💡 UTILISEZ CES INFOS POUR:';
  RAISE NOTICE '- Adapter scripts migration aux valeurs enum exactes';
  RAISE NOTICE '- Identifier colonnes manquantes précises';
  RAISE NOTICE '- Corriger policies RLS selon rôles disponibles';
  RAISE NOTICE '';
END $$;