-- ========================================
-- MIGRATION: INSERT TEST DATA
-- Date: 31 octobre 2025
-- Description: Insère des données de test pour développement
-- ========================================

-- 1. Créer une franchise de test (si n'existe pas déjà)
INSERT INTO franchises (name, city, country, status, contact_email, jarvis_config)
VALUES (
  'Test Franchise',
  'Paris',
  'FR',
  'active',
  'test@franchise.com',
  '{
    "voice_model": "alloy",
    "language": "fr",
    "openai_model": "gpt-4o-mini-realtime-preview-2024-12-17"
  }'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- 2. Créer une salle de test (si n'existe pas déjà)
INSERT INTO gyms (
  franchise_id,
  name,
  address,
  city,
  postal_code,
  status,
  opening_hours,
  features
)
SELECT
  f.id,
  'Test Gym',
  '123 Rue de la Musculation',
  'Paris',
  '75001',
  'active',
  '{
    "monday": {"open": "06:00", "close": "22:00"},
    "tuesday": {"open": "06:00", "close": "22:00"},
    "wednesday": {"open": "06:00", "close": "22:00"},
    "thursday": {"open": "06:00", "close": "22:00"},
    "friday": {"open": "06:00", "close": "22:00"},
    "saturday": {"open": "08:00", "close": "20:00"},
    "sunday": {"open": "08:00", "close": "20:00"}
  }'::jsonb,
  ARRAY['cardio', 'musculation', 'cours-collectifs']
FROM franchises f
WHERE f.name = 'Test Franchise'
ON CONFLICT (name) DO NOTHING;

-- 3. Créer un kiosk de test avec slug "gym-test"
INSERT INTO kiosks (
  gym_id,
  slug,
  name,
  provisioning_code,
  status,
  voice_model,
  language,
  openai_model,
  location_in_gym,
  hardware_info
)
SELECT
  g.id,
  'gym-test',
  'Test Gym - Kiosk Principal',
  'TEST01',
  'online',
  'alloy',
  'fr',
  'gpt-4o-mini-realtime-preview-2024-12-17',
  'Entrée principale',
  '{"hardware_version": "1.0"}'::jsonb
FROM gyms g
WHERE g.name = 'Test Gym'
ON CONFLICT (slug) DO UPDATE 
SET 
  status = 'online',
  provisioning_code = 'TEST01';

-- 4. Créer quelques membres de test
INSERT INTO gym_members (
  gym_id,
  badge_id,
  first_name,
  last_name,
  email,
  phone,
  membership_type,
  membership_status,
  join_date,
  facts
)
SELECT
  g.id,
  'BADGE' || lpad((ROW_NUMBER() OVER ())::text, 4, '0'),
  first_name,
  last_name,
  first_name || '.' || last_name || '@test.com',
  '+33612345678',
  'mensuel',
  'active',
  CURRENT_DATE - INTERVAL '30 days',
  '{}'::jsonb
FROM gyms g
CROSS JOIN (
  VALUES 
    ('Jean', 'Dupont'),
    ('Marie', 'Martin'),
    ('Pierre', 'Bernard'),
    ('Sophie', 'Dubois'),
    ('Luc', 'Thomas')
) AS names(first_name, last_name)
WHERE g.name = 'Test Gym'
ON CONFLICT (badge_id) DO NOTHING;

-- 5. Mettre à jour le user actuel pour lui donner accès au Test Gym (si super_admin)
-- Note: Remplacer email@example.com par ton email réel
UPDATE users
SET gym_id = (SELECT id FROM gyms WHERE name = 'Test Gym' LIMIT 1)
WHERE role = 'super_admin' 
AND gym_id IS NULL;

-- Confirmation
DO $$
DECLARE
  kiosk_count INT;
  member_count INT;
BEGIN
  SELECT COUNT(*) INTO kiosk_count FROM kiosks WHERE slug = 'gym-test';
  SELECT COUNT(*) INTO member_count FROM gym_members WHERE gym_id = (SELECT id FROM gyms WHERE name = 'Test Gym');
  
  RAISE NOTICE '✅ Migration terminée:';
  RAISE NOTICE '   - Kiosks créés: %', kiosk_count;
  RAISE NOTICE '   - Membres de test: %', member_count;
  RAISE NOTICE '   - Accès kiosk: https://jarvis-group.net/kiosk/gym-test';
  RAISE NOTICE '   - Code provisioning: TEST01';
END $$;


