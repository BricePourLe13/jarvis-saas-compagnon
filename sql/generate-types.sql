-- 🎯 GÉNÉRER LES TYPES TYPESCRIPT À PARTIR DE LA BDD RÉELLE
-- À exécuter dans Supabase pour obtenir les vrais types

-- 1. Structure des tables principales
SELECT 
  table_name,
  json_agg(
    json_build_object(
      'column_name', column_name,
      'data_type', data_type,
      'is_nullable', is_nullable,
      'column_default', column_default,
      'character_maximum_length', character_maximum_length
    )
    ORDER BY ordinal_position
  ) as columns
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name IN (
    'users', 'franchises', 'gyms', 'gym_members', 
    'jarvis_conversation_logs', 'openai_realtime_sessions',
    'kiosk_sessions', 'member_knowledge_base', 'member_session_analytics'
  )
GROUP BY table_name
ORDER BY table_name;

-- 2. Types ENUM
SELECT 
  t.typname as enum_name,
  array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('user_role', 'membership_type', 'gym_status')
GROUP BY t.typname
ORDER BY t.typname;

-- 3. Contraintes et relations
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE')
ORDER BY tc.table_name, tc.constraint_type;
