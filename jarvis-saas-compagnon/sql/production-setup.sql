-- ===========================================
-- 🚀 JARVIS - Configuration Production
-- ===========================================

-- 1. S'assurer que l'utilisateur existe dans la table users
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
  email = EXCLUDED.email,
  role = 'super_admin',
  is_active = true,
  updated_at = NOW();

-- 2. Activer RLS sur toutes les tables
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiosk_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Supprimer les anciennes politiques pour les recréer
DROP POLICY IF EXISTS "Franchises visibles par propriétaires et admins" ON franchises;
DROP POLICY IF EXISTS "Franchises modifiables par propriétaires" ON franchises;
DROP POLICY IF EXISTS "Nouvelles franchises par utilisateurs authentifiés" ON franchises;

-- 4. Créer des politiques RLS production-ready pour franchises
-- SELECT: Super admins voient tout, autres voient leurs franchises
CREATE POLICY "franchises_select_policy"
    ON franchises FOR SELECT
    USING (
        -- Super admin voit tout
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'super_admin'
        )
        OR
        -- Propriétaires voient leurs franchises
        auth.uid() = owner_id
        OR
        -- Franchise admins voient les franchises de leur organisation
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('franchise_admin', 'franchise_owner')
            AND u.franchise_id IN (
                SELECT id FROM franchises WHERE id = franchises.id
            )
        )
    );

-- INSERT: Super admins et propriétaires peuvent créer
CREATE POLICY "franchises_insert_policy"
    ON franchises FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('super_admin', 'franchise_owner')
        )
    );

-- UPDATE: Super admins et propriétaires peuvent modifier
CREATE POLICY "franchises_update_policy"
    ON franchises FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'super_admin'
        )
        OR
        auth.uid() = owner_id
    );

-- DELETE: Seuls les super admins peuvent supprimer
CREATE POLICY "franchises_delete_policy"
    ON franchises FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'super_admin'
        )
    );

-- 5. Politiques pour la table users
DROP POLICY IF EXISTS "Utilisateurs visibles selon franchise" ON users;
DROP POLICY IF EXISTS "Utilisateurs modifiables par eux-mêmes ou admins" ON users;

CREATE POLICY "users_select_policy"
    ON users FOR SELECT
    USING (
        -- Les utilisateurs voient leur propre profil
        auth.uid() = id
        OR
        -- Super admins voient tout
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'super_admin'
        )
        OR
        -- Franchise admins voient les utilisateurs de leur franchise
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('franchise_admin', 'franchise_owner')
            AND u.franchise_id = users.franchise_id
        )
    );

CREATE POLICY "users_update_policy"
    ON users FOR UPDATE
    USING (
        auth.uid() = id
        OR
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'super_admin'
        )
    );

-- 6. Créer des franchises de test avec le bon owner_id
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
  ),
  (
    uuid_generate_v4(),
    'JARVIS Toulouse Capitole',
    '321 Rue de Metz',
    'Toulouse',
    '31000',
    'toulouse@jarvis-group.net',
    '05.61.23.45.67',
    'd1af649d-3498-49f4-9e43-688355e2af46',
    false
  ),
  (
    uuid_generate_v4(),
    'JARVIS Nice Promenade',
    '654 Promenade des Anglais',
    'Nice',
    '06000',
    'nice@jarvis-group.net',
    '04.93.23.45.67',
    'd1af649d-3498-49f4-9e43-688355e2af46',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- 7. Vérifications finales
SELECT 
    'Configuration production terminée !' as message,
    count(*) as franchises_created 
FROM franchises 
WHERE owner_id = 'd1af649d-3498-49f4-9e43-688355e2af46';

-- Test des permissions
SELECT 
    'Test permissions:' as test,
    u.email,
    u.role,
    count(f.id) as franchises_accessible
FROM users u
LEFT JOIN franchises f ON (
    u.role = 'super_admin' 
    OR u.id = f.owner_id
)
WHERE u.id = 'd1af649d-3498-49f4-9e43-688355e2af46'
GROUP BY u.email, u.role; 