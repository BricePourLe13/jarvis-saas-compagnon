-- 🔧 FIX: Assigner un manager à une gym pour tester

-- 1. Voir les gyms disponibles
SELECT id, name, manager_id FROM gyms LIMIT 5;

-- 2. Voir les utilisateurs disponibles
SELECT id, email, role FROM users WHERE role IN ('super_admin', 'manager', 'franchise_admin');

-- 3. Assigner brice@jarvis-group.net comme manager de la gym AREA
UPDATE gyms 
SET manager_id = (
    SELECT id FROM users WHERE email = 'brice@jarvis-group.net'
)
WHERE name = 'AREA';

-- 4. Vérifier l'assignation
SELECT 
    g.name as gym_name,
    g.manager_id,
    u.email as manager_email,
    u.role as manager_role
FROM gyms g
LEFT JOIN users u ON g.manager_id = u.id
WHERE g.name = 'AREA';
