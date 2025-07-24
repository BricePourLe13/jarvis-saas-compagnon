-- ===========================================
-- 🎫 JARVIS KIOSK - Schéma Membres & RFID
-- ===========================================

-- 1. Table des membres par salle (avec badges RFID)
CREATE TABLE IF NOT EXISTS gym_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  
  -- Badge RFID
  badge_id VARCHAR(50) UNIQUE NOT NULL, -- ID physique du badge
  
  -- Informations membre
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  
  -- Membership
  membership_type VARCHAR(50) DEFAULT 'standard', -- basic, premium, vip
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
  member_notes TEXT, -- Notes privées pour JARVIS
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Index pour performance
CREATE INDEX IF NOT EXISTS idx_gym_members_gym_id ON gym_members(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_members_badge_id ON gym_members(badge_id);
CREATE INDEX IF NOT EXISTS idx_gym_members_active ON gym_members(is_active);

-- 3. Mettre à jour jarvis_sessions pour inclure member_id
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
        
        CREATE INDEX IF NOT EXISTS idx_jarvis_sessions_member_id ON jarvis_sessions(member_id);
    END IF;
    
    -- Ajouter autres colonnes utiles
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
END $$;

-- 4. Mettre à jour kiosk_config dans gyms avec nouveaux champs
UPDATE gyms 
SET kiosk_config = kiosk_config || '{
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
WHERE kiosk_config IS NOT NULL;

-- 5. Fonctions utilitaires pour kiosk
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

-- 6. RLS pour gym_members
ALTER TABLE gym_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gym_members_access"
  ON gym_members FOR ALL
  USING (
    -- Super admin voit tout
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
    OR
    -- Accès basé sur la salle
    gym_id IN (
      SELECT g.id FROM gyms g
      JOIN franchises f ON g.franchise_id = f.id
      WHERE f.owner_id = auth.uid()
      OR g.manager_id = auth.uid()
      OR g.id = ANY(
        SELECT unnest(gym_access) 
        FROM users 
        WHERE id = auth.uid()
      )
    )
  );

-- 7. Trigger pour updated_at
CREATE TRIGGER update_gym_members_updated_at
    BEFORE UPDATE ON gym_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Données de test (optionnel)
INSERT INTO gym_members (gym_id, badge_id, first_name, last_name, email, member_preferences) 
SELECT 
  g.id,
  'BADGE' || LPAD((ROW_NUMBER() OVER())::text, 4, '0'),
  CASE (ROW_NUMBER() OVER()) % 5
    WHEN 1 THEN 'Marie'
    WHEN 2 THEN 'Thomas'
    WHEN 3 THEN 'Julie'
    WHEN 4 THEN 'Antoine' 
    ELSE 'Sophie'
  END,
  CASE (ROW_NUMBER() OVER()) % 5
    WHEN 1 THEN 'Dubois'
    WHEN 2 THEN 'Martin'
    WHEN 3 THEN 'Leroux'
    WHEN 4 THEN 'Moreau'
    ELSE 'Bernard'
  END,
  'membre' || (ROW_NUMBER() OVER()) || '@example.com',
  '{
    "language": "fr",
    "goals": ["perte_poids", "musculation"],
    "favorite_activities": ["cardio", "yoga"],
    "dietary_restrictions": []
  }'::jsonb
FROM gyms g
LIMIT 20
ON CONFLICT (badge_id) DO NOTHING;

SELECT 'Schéma membres créé avec succès !' as status;
SELECT COUNT(*) as total_members FROM gym_members; 