-- ===========================================
-- 🔧 JARVIS - Fix Simple pour Tables Membres v2
-- Script corrigé sans erreur de syntaxe
-- ===========================================

-- 1. CRÉER TABLE GYM_MEMBERS (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS gym_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL,
  
  -- Badge RFID Physique
  badge_id VARCHAR(255) UNIQUE NOT NULL,
  badge_type VARCHAR(50) DEFAULT 'rfid',
  
  -- Informations Personnelles  
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  
  -- Membership Details
  membership_type VARCHAR(100) NOT NULL DEFAULT 'Standard',
  member_since DATE NOT NULL DEFAULT CURRENT_DATE,
  membership_status VARCHAR(50) DEFAULT 'active',
  
  -- Préférences JARVIS
  member_preferences JSONB DEFAULT '{}',
  
  -- Statistiques
  total_visits INTEGER DEFAULT 0,
  last_visit TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  can_use_jarvis BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CRÉER INDEX BADGE_ID (si il n'existe pas)
CREATE UNIQUE INDEX IF NOT EXISTS idx_gym_members_badge_unique ON gym_members(badge_id);

-- 3. VÉRIFIER SI DES SALLES EXISTENT
DO $$ 
DECLARE
    first_gym_id UUID;
    franchise_count INTEGER;
BEGIN
    -- Compter les franchises existantes
    SELECT count(*) INTO franchise_count FROM franchises;
    
    -- S'assurer qu'au moins une franchise existe
    IF franchise_count = 0 THEN
        INSERT INTO franchises (name, contact_email, city, postal_code)
        VALUES ('Franchise Test JARVIS', 'test@jarvis.com', 'Test City', '12345')
        ON CONFLICT DO NOTHING;
        RAISE NOTICE 'Franchise de test créée';
    END IF;
    
    -- Vérifier si des salles existent
    SELECT id INTO first_gym_id FROM gyms ORDER BY created_at LIMIT 1;
    
    IF first_gym_id IS NULL THEN
        -- Insérer une salle de test si aucune n'existe
        INSERT INTO gyms (id, franchise_id, name, address, city, postal_code, kiosk_config)
        VALUES (
            uuid_generate_v4(),
            (SELECT id FROM franchises ORDER BY created_at LIMIT 1),
            'Salle de Test JARVIS',
            '123 Rue Test',
            'Test City',
            '12345',
            '{"kiosk_url_slug": "gym-test"}'::jsonb
        );
        
        RAISE NOTICE 'Salle de test créée avec slug: gym-test';
    ELSE
        -- Mettre à jour la première salle pour avoir le bon slug
        UPDATE gyms 
        SET kiosk_config = jsonb_set(
            COALESCE(kiosk_config, '{}'), 
            '{kiosk_url_slug}', 
            '"gym-test"'
        )
        WHERE id = first_gym_id 
        AND (kiosk_config->>'kiosk_url_slug' IS NULL OR kiosk_config->>'kiosk_url_slug' = '');
        
        RAISE NOTICE 'Salle existante mise à jour avec slug: gym-test';
    END IF;
END $$;

-- 4. INSÉRER LES MEMBRES DE TEST
INSERT INTO gym_members (gym_id, badge_id, first_name, last_name, email, membership_type, member_preferences, total_visits, last_visit)
SELECT 
  g.id,
  'BADGE_001',
  'Pierre',
  'Martin', 
  'pierre.martin@email.com',
  'Premium',
  '{"language": "fr", "goals": ["Perte de poids", "Renforcement musculaire"], "favorite_activities": ["Cardio", "Musculation"]}'::jsonb,
  156,
  '2024-01-20 09:30:00'::timestamp
FROM gyms g 
WHERE g.kiosk_config->>'kiosk_url_slug' = 'gym-test'
LIMIT 1
ON CONFLICT (badge_id) DO NOTHING;

INSERT INTO gym_members (gym_id, badge_id, first_name, last_name, email, membership_type, member_preferences, total_visits, last_visit)
SELECT 
  g.id,
  'BADGE_002',
  'Sophie',
  'Dubois',
  'sophie.dubois@email.com',
  'Standard',
  '{"language": "fr", "goals": ["Flexibilité", "Bien-être"], "favorite_activities": ["Yoga", "Pilates"]}'::jsonb,
  87,
  '2024-01-19 18:45:00'::timestamp
FROM gyms g 
WHERE g.kiosk_config->>'kiosk_url_slug' = 'gym-test'
LIMIT 1
ON CONFLICT (badge_id) DO NOTHING;

INSERT INTO gym_members (gym_id, badge_id, first_name, last_name, email, membership_type, member_preferences, total_visits, last_visit)
SELECT 
  g.id,
  'BADGE_003',
  'Alex',
  'Chen',
  'alex.chen@email.com',
  'Elite',
  '{"language": "en", "goals": ["Performance", "Gain musculaire"], "favorite_activities": ["CrossFit", "Haltérophilie"]}'::jsonb,
  342,
  '2024-01-21 07:15:00'::timestamp
FROM gyms g 
WHERE g.kiosk_config->>'kiosk_url_slug' = 'gym-test'
LIMIT 1
ON CONFLICT (badge_id) DO NOTHING;

-- 5. VÉRIFICATION FINALE
SELECT 
    'Tables créées !' as status,
    (SELECT count(*) FROM gym_members) as total_membres,
    (SELECT count(*) FROM gyms WHERE kiosk_config->>'kiosk_url_slug' = 'gym-test') as salles_test,
    (SELECT count(*) FROM franchises) as total_franchises; 