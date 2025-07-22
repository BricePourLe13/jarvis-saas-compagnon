-- ===========================================
-- 🔍 TEST: Vérification de la table gyms
-- ===========================================

-- 1. Vérifier l'existence de la table gyms
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'gyms'
ORDER BY ordinal_position;

-- 2. Compter les salles existantes
SELECT COUNT(*) as total_gyms FROM gyms;

-- 3. Lister toutes les salles (si il y en a)
SELECT 
    id,
    name,
    franchise_id,
    city,
    status,
    created_at
FROM gyms 
ORDER BY created_at DESC
LIMIT 10;

-- 4. Vérifier les franchises existantes
SELECT 
    id,
    name as franchise_name,
    contact_email,
    status,
    created_at
FROM franchises 
ORDER BY created_at DESC
LIMIT 5; 