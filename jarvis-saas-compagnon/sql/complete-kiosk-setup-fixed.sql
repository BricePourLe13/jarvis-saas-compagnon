-- ===========================================
-- 🤖 JARVIS KIOSK - SETUP COMPLET (CORRIGÉ)
-- ===========================================

-- 1. Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Créer la table jarvis_sessions si elle n'existe pas
CREATE TABLE IF NOT EXISTS jarvis_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL,
  
  -- Conversation basique (sera étendue)
  conversation_transcript JSONB DEFAULT '[]'::jsonb,
  session_duration INTEGER NOT NULL DEFAULT 0,
  processed_by_ai BOOLEAN DEFAULT false,
  
  -- Metadata
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Table des membres par salle (avec badges RFID)
CREATE TABLE IF NOT EXISTS gym_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL,
  
  -- Badge RFID
  badge_id VARCHAR(50) UNIQUE NOT NULL,
  
  -- Informations membre
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  
  -- Membership
  membership_type VARCHAR(50) DEFAULT 'standard',
  member_since DATE DEFAULT CURRENT_DATE,
  membership_expires DATE,
  
  -- Préférences & Contexte JARVIS
  member_preferences JSONB DEFAULT '{
    "language": "fr",
    "goals": [],
    "dietary_restrictions": [],
    "favorite_activities": [],
    "notification_preferences": {
      "email": true,
      "sms": false
    }
  }'::jsonb,
  
  -- Historique & Stats
  total_visits INTEGER DEFAULT 0,
  last_visit TIMESTAMP WITH TIME ZONE,
  member_notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Ajouter les colonnes manquantes à jarvis_sessions
DO $$
BEGIN
    -- Ajouter colonne member_id si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jarvis_sessions' 
        AND column_name = 'member_id'
    ) THEN
        ALTER TABLE jarvis_sessions 
        ADD COLUMN member_id UUID REFERENCES gym_members(id) ON DELETE SET NULL;
    END IF;
    
    -- Ajouter autres colonnes utiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jarvis_sessions' 
        AND column_name = 'member_badge_id'
    ) THEN
        ALTER TABLE jarvis_sessions ADD COLUMN member_badge_id VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jarvis_sessions' 
        AND column_name = 'language'
    ) THEN
        ALTER TABLE jarvis_sessions ADD COLUMN language VARCHAR(5) DEFAULT 'fr';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jarvis_sessions' 
        AND column_name = 'conversation_summary'
    ) THEN
        ALTER TABLE jarvis_sessions ADD COLUMN conversation_summary TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jarvis_sessions' 
        AND column_name = 'satisfaction_score'
    ) THEN
        ALTER TABLE jarvis_sessions ADD COLUMN satisfaction_score INTEGER CHECK (satisfaction_score BETWEEN 1 AND 5);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jarvis_sessions' 
        AND column_name = 'intent_detected'
    ) THEN
        ALTER TABLE jarvis_sessions ADD COLUMN intent_detected TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jarvis_sessions' 
        AND column_name = 'sentiment_score'
    ) THEN
        ALTER TABLE jarvis_sessions ADD COLUMN sentiment_score DECIMAL(3,2);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jarvis_sessions' 
        AND column_name = 'kiosk_url_slug'
    ) THEN
        ALTER TABLE jarvis_sessions ADD COLUMN kiosk_url_slug VARCHAR(255);
    END IF;
END $$;

-- 5. Index pour performance
CREATE INDEX IF NOT EXISTS idx_gym_members_gym_id ON gym_members(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_members_badge_id ON gym_members(badge_id);
CREATE INDEX IF NOT EXISTS idx_gym_members_active ON gym_members(is_active);
CREATE INDEX IF NOT EXISTS idx_jarvis_sessions_member_id ON jarvis_sessions(member_id);
CREATE INDEX IF NOT EXISTS idx_jarvis_sessions_gym_id ON jarvis_sessions(gym_id);

-- 6. Mettre à jour kiosk_config dans gyms existantes
UPDATE gyms 
SET kiosk_config = COALESCE(kiosk_config, '{}') || '{
  "provisioning_code": null,
  "kiosk_url_slug": null,
  "installation_token": null,
  "provisioning_expires_at": null,
  "is_provisioned": false,
  "provisioned_at": null,
  "last_heartbeat": null,
  "rfid_reader_id": null,
  "screen_resolution": null,
  "browser_info": {},
  "avatar_style": "friendly",
  "welcome_message": "Bonjour ! Comment puis-je vous aider ?",
  "language_default": "fr",
  "languages_available": ["fr", "en", "es"]
}'::jsonb
WHERE TRUE;

-- 7. Fonctions utilitaires
CREATE OR REPLACE FUNCTION generate_kiosk_provisioning_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_kiosk_url_slug()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := 'jarvis-';
  i INTEGER;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  -- Vérifier l'unicité
  WHILE EXISTS (SELECT 1 FROM gyms WHERE kiosk_config->>'kiosk_url_slug' = result) LOOP
    result := 'jarvis-';
    FOR i IN 1..12 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger pour updated_at sur gym_members
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gym_members_updated_at
    BEFORE UPDATE ON gym_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. RLS pour gym_members (temporairement permissif pour les tests)
ALTER TABLE gym_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gym_members_allow_all_for_now" ON gym_members;
CREATE POLICY "gym_members_allow_all_for_now"
  ON gym_members FOR ALL
  USING (true)
  WITH CHECK (true);

-- 10. Créer une franchise de test si nécessaire
INSERT INTO franchises (
  id,
  name,
  contact_email,
  status,
  created_at
)
SELECT 
  uuid_generate_v4(),
  'Franchise Demo JARVIS',
  'demo@jarvis.com',
  'active',
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM franchises WHERE status = 'active')
ON CONFLICT DO NOTHING;

-- 11. Créer la salle de test avec kiosk configuré
DO $$
DECLARE
    franchise_uuid UUID;
    welcome_msg TEXT := 'Bonjour ! Je suis JARVIS, votre assistant personnel. Comment puis-je vous aider aujourd''hui ?';
BEGIN
    -- Récupérer une franchise active
    SELECT id INTO franchise_uuid FROM franchises WHERE status = 'active' LIMIT 1;
    
    -- Créer la salle avec le bon JSON
    INSERT INTO gyms (
        id,
        franchise_id, 
        name, 
        address, 
        city, 
        postal_code, 
        kiosk_config,
        status
    ) VALUES (
        uuid_generate_v4(),
        franchise_uuid,
        'JARVIS Demo Gym',
        '123 Avenue de la Technologie',
        'Paris',
        '75001',
        jsonb_build_object(
            'kiosk_url_slug', 'gym-d4weyu08',
            'provisioning_code', 'KIOSK001',
            'is_provisioned', true,
            'provisioned_at', NOW()::text,
            'avatar_style', 'friendly',
            'welcome_message', welcome_msg,
            'language_default', 'fr',
            'languages_available', ARRAY['fr', 'en', 'es'],
            'brand_colors', jsonb_build_object(
                'primary', '#2563eb',
                'secondary', '#1e40af',
                'accent', '#3b82f6'
            )
        ),
        'active'
    )
    ON CONFLICT DO NOTHING;
END $$;

-- 12. Créer des membres de test
INSERT INTO gym_members (
  gym_id, 
  badge_id, 
  first_name, 
  last_name, 
  email,
  member_preferences
) 
SELECT 
  g.id,
  'BADGE0001',
  'Marie',
  'Dubois',
  'marie.dubois@example.com',
  jsonb_build_object(
    'language', 'fr',
    'goals', ARRAY['perte_poids', 'musculation'],
    'favorite_activities', ARRAY['cardio', 'yoga'],
    'dietary_restrictions', ARRAY['vegetarien'],
    'notification_preferences', jsonb_build_object(
      'email', true,
      'sms', false
    )
  )
FROM gyms g 
WHERE g.kiosk_config->>'kiosk_url_slug' = 'gym-d4weyu08'
ON CONFLICT (badge_id) DO NOTHING;

INSERT INTO gym_members (
  gym_id, 
  badge_id, 
  first_name, 
  last_name, 
  email,
  member_preferences
) 
SELECT 
  g.id,
  'BADGE0002',
  'Thomas',
  'Martin',
  'thomas.martin@example.com',
  jsonb_build_object(
    'language', 'fr',
    'goals', ARRAY['musculation', 'force'],
    'favorite_activities', ARRAY['musculation', 'crossfit'],
    'dietary_restrictions', ARRAY[]::text[],
    'notification_preferences', jsonb_build_object(
      'email', true,
      'sms', true
    )
  )
FROM gyms g 
WHERE g.kiosk_config->>'kiosk_url_slug' = 'gym-d4weyu08'
ON CONFLICT (badge_id) DO NOTHING;

INSERT INTO gym_members (
  gym_id, 
  badge_id, 
  first_name, 
  last_name, 
  email,
  member_preferences
) 
SELECT 
  g.id,
  'BADGE0003',
  'Julie',
  'Leroux',
  'julie.leroux@example.com',
  jsonb_build_object(
    'language', 'en',
    'goals', ARRAY['fitness', 'bien_etre'],
    'favorite_activities', ARRAY['yoga', 'pilates', 'natation'],
    'dietary_restrictions', ARRAY['sans_gluten'],
    'notification_preferences', jsonb_build_object(
      'email', true,
      'sms', false
    )
  )
FROM gyms g 
WHERE g.kiosk_config->>'kiosk_url_slug' = 'gym-d4weyu08'
ON CONFLICT (badge_id) DO NOTHING;

-- 13. Vérifications finales
SELECT 
  '✅ SETUP COMPLET !' as status,
  '/kiosk/gym-d4weyu08' as kiosk_url;

SELECT 
  g.name as gym_name,
  g.kiosk_config->>'kiosk_url_slug' as slug,
  g.kiosk_config->>'is_provisioned' as provisioned,
  COUNT(gm.id) as membres_count
FROM gyms g
LEFT JOIN gym_members gm ON g.id = gm.gym_id
WHERE g.kiosk_config->>'kiosk_url_slug' = 'gym-d4weyu08'
GROUP BY g.id, g.name, g.kiosk_config;

SELECT 
  gm.badge_id,
  gm.first_name,
  gm.last_name,
  gm.member_preferences->>'language' as langue
FROM gym_members gm
JOIN gyms g ON gm.gym_id = g.id
WHERE g.kiosk_config->>'kiosk_url_slug' = 'gym-d4weyu08';

SELECT '🎯 PRÊT ! Allez sur: http://localhost:3000/kiosk/gym-d4weyu08' as next_step; 