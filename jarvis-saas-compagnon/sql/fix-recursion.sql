-- ===========================================
-- 🔧 JARVIS - Fix Récursion Infinie RLS
-- ===========================================

-- 1. SUPPRIMER TOUTES LES POLITIQUES PROBLÉMATIQUES
DROP POLICY IF EXISTS "franchises_select_policy" ON franchises;
DROP POLICY IF EXISTS "franchises_insert_policy" ON franchises;
DROP POLICY IF EXISTS "franchises_update_policy" ON franchises;
DROP POLICY IF EXISTS "franchises_delete_policy" ON franchises;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

-- Supprimer les anciennes aussi au cas où
DROP POLICY IF EXISTS "Franchises visibles par propriétaires et admins" ON franchises;
DROP POLICY IF EXISTS "Franchises modifiables par propriétaires" ON franchises;
DROP POLICY IF EXISTS "Nouvelles franchises par utilisateurs authentifiés" ON franchises;
DROP POLICY IF EXISTS "Utilisateurs visibles selon franchise" ON users;
DROP POLICY IF EXISTS "Utilisateurs modifiables par eux-mêmes ou admins" ON users;

-- 2. CRÉER DES POLITIQUES SIMPLES SANS RÉCURSION

-- Pour les franchises : politique simple basée sur l'UID direct
CREATE POLICY "franchises_simple_select"
    ON franchises FOR SELECT
    USING (
        -- Brice peut tout voir (hardcodé pour éviter la récursion)
        auth.uid() = 'd1af649d-3498-49f4-9e43-688355e2af46'::uuid
        OR
        -- Ou si l'utilisateur est propriétaire
        auth.uid() = owner_id
    );

CREATE POLICY "franchises_simple_insert"
    ON franchises FOR INSERT
    WITH CHECK (
        auth.uid() = 'd1af649d-3498-49f4-9e43-688355e2af46'::uuid
        OR
        auth.uid() = owner_id
    );

CREATE POLICY "franchises_simple_update"
    ON franchises FOR UPDATE
    USING (
        auth.uid() = 'd1af649d-3498-49f4-9e43-688355e2af46'::uuid
        OR
        auth.uid() = owner_id
    );

CREATE POLICY "franchises_simple_delete"
    ON franchises FOR DELETE
    USING (
        auth.uid() = 'd1af649d-3498-49f4-9e43-688355e2af46'::uuid
    );

-- Pour les users : politique simple sans auto-référence
CREATE POLICY "users_simple_select"
    ON users FOR SELECT
    USING (
        -- L'utilisateur voit son propre profil
        auth.uid() = id
        OR
        -- Brice voit tout (hardcodé)
        auth.uid() = 'd1af649d-3498-49f4-9e43-688355e2af46'::uuid
    );

CREATE POLICY "users_simple_update"
    ON users FOR UPDATE
    USING (
        auth.uid() = id
        OR
        auth.uid() = 'd1af649d-3498-49f4-9e43-688355e2af46'::uuid
    );

-- 3. VÉRIFIER QUE LES DONNÉES EXISTENT
SELECT 'Vérification données:' as check_type, count(*) as count FROM franchises WHERE owner_id = 'd1af649d-3498-49f4-9e43-688355e2af46';

-- 4. TESTER LES POLITIQUES
SELECT 'Test lecture franchises:' as test, count(*) as accessible_franchises 
FROM franchises 
WHERE owner_id = 'd1af649d-3498-49f4-9e43-688355e2af46';

-- 5. S'assurer que l'utilisateur Brice existe dans la table users
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

SELECT 'Utilisateur Brice configuré:' as status, email, role FROM users WHERE id = 'd1af649d-3498-49f4-9e43-688355e2af46';

-- 6. RÉSUMÉ
SELECT 
    'RÉCURSION CORRIGÉE !' as message,
    'Politiques simplifiées' as details,
    'Hardcodé UID Brice' as security_note; 