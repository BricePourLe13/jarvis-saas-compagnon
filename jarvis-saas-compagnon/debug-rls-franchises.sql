-- =======================================
-- 🔍 DEBUG RLS POUR FRANCHISES
-- =======================================

-- 1. Vérifier les politiques RLS actuelles
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
WHERE tablename IN ('franchises', 'gyms')
ORDER BY tablename, policyname;

-- 2. Vérifier si RLS est activé
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('franchises', 'gyms');

-- 3. Tester l'accès direct aux franchises
SELECT 
  '🏢 ACCÈS DIRECT FRANCHISES' as test,
  id,
  name,
  city,
  is_active
FROM franchises
ORDER BY created_at DESC;

-- 4. Tester l'accès direct aux salles
SELECT 
  '🏋️ ACCÈS DIRECT SALLES' as test,
  g.id,
  g.name,
  g.city,
  f.name as franchise_name
FROM gyms g
LEFT JOIN franchises f ON g.franchise_id = f.id
ORDER BY g.created_at DESC;

-- 5. Vérifier l'utilisateur actuel
SELECT 
  '👤 UTILISATEUR ACTUEL' as test,
  current_user as current_user,
  session_user as session_user,
  auth.uid() as auth_uid,
  auth.email() as auth_email;

-- 6. Si aucune donnée visible, créer une politique permissive temporaire
DO $$
BEGIN
  -- Politique temporaire pour permettre la lecture des franchises
  DROP POLICY IF EXISTS "temp_allow_all_franchises_read" ON franchises;
  CREATE POLICY "temp_allow_all_franchises_read" ON franchises
    FOR SELECT
    USING (true);

  -- Politique temporaire pour permettre la lecture des salles
  DROP POLICY IF EXISTS "temp_allow_all_gyms_read" ON gyms;
  CREATE POLICY "temp_allow_all_gyms_read" ON gyms
    FOR SELECT
    USING (true);

  RAISE NOTICE '✅ Politiques temporaires créées pour debug';
  RAISE NOTICE '⚠️  ATTENTION: Ces politiques sont permissives - à supprimer après debug !';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erreur lors de la création des politiques: %', SQLERRM;
END $$;