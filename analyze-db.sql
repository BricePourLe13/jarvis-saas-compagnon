-- 🔍 ANALYSE COMPLÈTE DE LA BASE DE DONNÉES

-- 1. Liste toutes les tables
SELECT 
  'TABLE EXISTANTE: ' || table_name as info,
  table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Structure détaillée de chaque table
SELECT 
  'COLONNE: ' || table_name || '.' || column_name as info,
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 3. Contraintes et relations
SELECT 
  'CONTRAINTE: ' || table_name as info,
  table_name,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public';

-- 4. Foreign Keys
SELECT 
  'FK: ' || tc.table_name || '.' || kcu.column_name || ' -> ' || ccu.table_name || '.' || ccu.column_name as info,
  tc.table_name as from_table,
  kcu.column_name as from_column,
  ccu.table_name as to_table,
  ccu.column_name as to_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';

-- 5. Politiques RLS
SELECT 
  'RLS: ' || tablename as info,
  tablename,
  policyname,
  cmd,
  permissive,
  roles::text,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
