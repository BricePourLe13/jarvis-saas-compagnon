-- 🏷️ INSERTION MEMBRES DE DEMO POUR TESTS KIOSK
-- Ces membres correspondent aux badges du RFIDSimulator

-- Vérifier si les membres existent déjà
DO $$
BEGIN
  -- Pierre Martin (BADGE_001)
  IF NOT EXISTS (SELECT 1 FROM gym_members WHERE badge_id = 'BADGE_001') THEN
    INSERT INTO gym_members (
      id,
      gym_id,
      badge_id,
      first_name,
      last_name,
      email,
      phone,
      membership_type,
      member_since,
      member_preferences,
      total_visits,
      last_visit,
      is_active,
      can_use_jarvis,
      created_at,
      updated_at
    ) VALUES (
      '3663c1b6-cc68-47e3-8cfe-698422cd9331',
      '42f6adf0-f222-4018-bb19-4f60e2a351f4', -- gym-yatblc8h
      'BADGE_001',
      'Pierre',
      'Martin',
      'pierre.martin@email.com',
      '+33 6 12 34 56 78',
      'Premium',
      '2023-06-15',
      '{
        "language": "fr",
        "goals": ["Perte de poids", "Renforcement musculaire"],
        "dietary_restrictions": [],
        "favorite_activities": ["Cardio", "Musculation"],
        "notification_preferences": {
          "email": true,
          "sms": true
        }
      }'::jsonb,
      156,
      '2024-01-20T09:30:00Z',
      true,
      true,
      '2023-06-15T00:00:00Z',
      '2024-01-20T09:30:00Z'
    );
    RAISE NOTICE '✅ Pierre Martin (BADGE_001) ajouté avec succès';
  ELSE
    RAISE NOTICE 'ℹ️ Pierre Martin (BADGE_001) existe déjà';
  END IF;

  -- Sophie Dubois (BADGE_002)
  IF NOT EXISTS (SELECT 1 FROM gym_members WHERE badge_id = 'BADGE_002') THEN
    INSERT INTO gym_members (
      id,
      gym_id,
      badge_id,
      first_name,
      last_name,
      email,
      phone,
      membership_type,
      member_since,
      member_preferences,
      total_visits,
      last_visit,
      is_active,
      can_use_jarvis,
      created_at,
      updated_at
    ) VALUES (
      '02cdb76c-a920-4d26-a58b-ffa177fb0093',
      '42f6adf0-f222-4018-bb19-4f60e2a351f4', -- gym-yatblc8h
      'BADGE_002',
      'Sophie',
      'Dubois',
      'sophie.dubois@email.com',
      '+33 6 98 76 54 32',
      'Standard',
      '2023-11-02',
      '{
        "language": "fr",
        "goals": ["Flexibilité", "Bien-être"],
        "dietary_restrictions": [],
        "favorite_activities": ["Yoga", "Pilates"],
        "notification_preferences": {
          "email": true,
          "sms": false
        }
      }'::jsonb,
      87,
      '2024-01-19T18:45:00Z',
      true,
      true,
      '2023-11-02T00:00:00Z',
      '2024-01-19T18:45:00Z'
    );
    RAISE NOTICE '✅ Sophie Dubois (BADGE_002) ajoutée avec succès';
  ELSE
    RAISE NOTICE 'ℹ️ Sophie Dubois (BADGE_002) existe déjà';
  END IF;

  -- Marc Leroy (BADGE_003)
  IF NOT EXISTS (SELECT 1 FROM gym_members WHERE badge_id = 'BADGE_003') THEN
    INSERT INTO gym_members (
      id,
      gym_id,
      badge_id,
      first_name,
      last_name,
      email,
      phone,
      membership_type,
      member_since,
      member_preferences,
      total_visits,
      last_visit,
      is_active,
      can_use_jarvis,
      created_at,
      updated_at
    ) VALUES (
      '8b28c7c3-45be-4c2d-baf4-d642ee9d4996',
      '42f6adf0-f222-4018-bb19-4f60e2a351f4', -- gym-yatblc8h
      'BADGE_003',
      'Marc',
      'Leroy',
      'marc.leroy@email.com',
      '+33 6 55 44 33 22',
      'Elite',
      '2022-03-20',
      '{
        "language": "fr",
        "goals": ["Performance", "Compétition"],
        "dietary_restrictions": ["Végétarien"],
        "favorite_activities": ["CrossFit", "Running"],
        "notification_preferences": {
          "email": true,
          "sms": true
        }
      }'::jsonb,
      298,
      '2024-01-21T07:15:00Z',
      true,
      true,
      '2022-03-20T00:00:00Z',
      '2024-01-21T07:15:00Z'
    );
    RAISE NOTICE '✅ Marc Leroy (BADGE_003) ajouté avec succès';
  ELSE
    RAISE NOTICE 'ℹ️ Marc Leroy (BADGE_003) existe déjà';
  END IF;

END $$;

-- Vérification finale
SELECT 
  badge_id,
  first_name,
  last_name,
  membership_type,
  total_visits,
  can_use_jarvis
FROM gym_members 
WHERE badge_id IN ('BADGE_001', 'BADGE_002', 'BADGE_003')
ORDER BY badge_id;
