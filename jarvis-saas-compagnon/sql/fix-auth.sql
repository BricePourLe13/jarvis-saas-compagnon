-- ===========================================
-- 🔧 JARVIS - Fix Auth & RLS pour développement
-- ===========================================

-- 1. Temporairement désactiver RLS pour permettre l'accès
ALTER TABLE franchises DISABLE ROW LEVEL SECURITY;

-- 2. Insérer des données de test pour le développement
INSERT INTO franchises (id, name, address, city, postal_code, email, phone, owner_id, is_active) 
VALUES 
  (
    uuid_generate_v4(),
    'FitGym Paris Centre',
    '123 Rue de Rivoli',
    'Paris',
    '75001',
    'paris@fitgym.fr',
    '01.23.45.67.89',
    uuid_generate_v4(),
    true
  ),
  (
    uuid_generate_v4(),
    'PowerGym Lyon',
    '456 Cours Lafayette',
    'Lyon',
    '69003',
    'lyon@powergym.fr',
    '04.78.90.12.34',
    uuid_generate_v4(),
    true
  ),
  (
    uuid_generate_v4(),
    'SportClub Marseille',
    '789 La Canebière',
    'Marseille',
    '13001',
    'marseille@sportclub.fr',
    '04.91.23.45.67',
    uuid_generate_v4(),
    false
  ),
  (
    uuid_generate_v4(),
    'GymCenter Toulouse',
    '321 Rue de Metz',
    'Toulouse',
    '31000',
    'toulouse@gymcenter.fr',
    '05.61.23.45.67',
    uuid_generate_v4(),
    true
  ),
  (
    uuid_generate_v4(),
    'FitnessClub Nice',
    '654 Promenade des Anglais',
    'Nice',
    '06000',
    'nice@fitnessclub.fr',
    '04.93.23.45.67',
    uuid_generate_v4(),
    true
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Alternative: Créer une politique RLS plus permissive pour le développement
-- (Optionnel - À utiliser seulement si on réactive RLS)

-- DROP POLICY IF EXISTS "Franchises visibles par propriétaires et admins" ON franchises;

-- CREATE POLICY "Dev - Toutes franchises visibles"
--     ON franchises FOR SELECT
--     USING (true);  -- Permet l'accès en lecture à tous

-- 4. Vérifier les données insérées
SELECT count(*) as total_franchises FROM franchises;
SELECT name, city, is_active FROM franchises ORDER BY created_at DESC;
