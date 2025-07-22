-- ===========================================
-- 🚨 JARVIS - Script d'Urgence : Désactiver RLS
-- ===========================================
-- ⚠️  ATTENTION: À utiliser SEULEMENT en cas d'urgence pour débloquer !
-- ⚠️  Ne PAS utiliser en production finale !

-- 1. DÉSACTIVER RLS TEMPORAIREMENT
ALTER TABLE franchises DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE kiosk_sessions DISABLE ROW LEVEL SECURITY;

-- 2. SUPPRIMER TOUTES LES POLITIQUES
DROP POLICY IF EXISTS "franchises_simple_select" ON franchises;
DROP POLICY IF EXISTS "franchises_simple_insert" ON franchises;
DROP POLICY IF EXISTS "franchises_simple_update" ON franchises;
DROP POLICY IF EXISTS "franchises_simple_delete" ON franchises;
DROP POLICY IF EXISTS "users_simple_select" ON users;
DROP POLICY IF EXISTS "users_simple_update" ON users;

-- Supprimer les anciennes politiques au cas où
DROP POLICY IF EXISTS "franchises_select_policy" ON franchises;
DROP POLICY IF EXISTS "franchises_insert_policy" ON franchises;
DROP POLICY IF EXISTS "franchises_update_policy" ON franchises;
DROP POLICY IF EXISTS "franchises_delete_policy" ON franchises;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

-- 3. VÉRIFIER L'ÉTAT
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled 
FROM pg_tables 
WHERE tablename IN ('franchises', 'users', 'kiosk_sessions');

-- 4. CRÉER LES FRANCHISES DE TEST SI ELLES N'EXISTENT PAS
INSERT INTO franchises (id, name, address, city, postal_code, email, phone, owner_id, is_active) 
VALUES 
  (
    uuid_generate_v4(),
    'JARVIS Flagship Paris',
    '123 Avenue des Champs-Élysées',
    'Paris',
    '75008',
    'paris@jarvis-group.net',
    '01.42.56.78.90',
    'd1af649d-3498-49f4-9e43-688355e2af46',
    true
  ),
  (
    uuid_generate_v4(),
    'JARVIS Lyon Part-Dieu',
    '456 Rue de la République',
    'Lyon',
    '69002',
    'lyon@jarvis-group.net',
    '04.78.91.23.45',
    'd1af649d-3498-49f4-9e43-688355e2af46',
    true
  ),
  (
    uuid_generate_v4(),
    'JARVIS Marseille Vieux-Port',
    '789 La Canebière',
    'Marseille',
    '13001',
    'marseille@jarvis-group.net',
    '04.91.23.45.67',
    'd1af649d-3498-49f4-9e43-688355e2af46',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- 5. CONFIGURER L'UTILISATEUR BRICE
INSERT INTO users (id, email, full_name, role, is_active, created_at, updated_at) 
VALUES (
  'd1af649d-3498-49f4-9e43-688355e2af46',
  'brice@jarvis-group.net',
  'Brice Pradet',
  'super_admin',
  true,
  NOW(),
  NOW()
) 
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'super_admin',
  is_active = true,
  updated_at = NOW();

-- 6. VÉRIFICATIONS FINALES
SELECT 'RLS DÉSACTIVÉ !' as status;
SELECT 'Franchises créées:' as info, count(*) as count FROM franchises;
SELECT 'Utilisateur Brice:' as info, email, role FROM users WHERE id = 'd1af649d-3498-49f4-9e43-688355e2af46';

-- 7. INSTRUCTIONS
SELECT '⚠️  RLS est maintenant DÉSACTIVÉ' as warning;
SELECT '✅ Ton dashboard devrait maintenant fonctionner' as success;
SELECT '🔧 Tu pourras réactiver RLS plus tard avec des politiques fixes' as next_step; 