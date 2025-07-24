-- ===========================================
-- 🏋️ JARVIS SaaS - Schéma Membres Production
-- Table manquante pour les vrais membres de salle
-- ===========================================

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- 🎫 TABLE: gym_members (NOUVEAUTÉ)
-- ===========================================
CREATE TABLE IF NOT EXISTS gym_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  
  -- Badge RFID Physique
  badge_id VARCHAR(255) UNIQUE NOT NULL, -- "BADGE_001", "RFID_XYZ123", etc.
  badge_type VARCHAR(50) DEFAULT 'rfid', -- 'rfid', 'nfc', 'qr_code'
  
  -- Informations Personnelles  
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  date_of_birth DATE,
  
  -- Membership Details
  membership_type VARCHAR(100) NOT NULL, -- 'Standard', 'Premium', 'Elite'
  member_since DATE NOT NULL DEFAULT CURRENT_DATE,
  membership_expires DATE,
  membership_status VARCHAR(50) DEFAULT 'active' CHECK (membership_status IN ('active', 'suspended', 'expired', 'cancelled')),
  
  -- Préférences JARVIS (pour personnalisation IA)
  member_preferences JSONB DEFAULT '{
    "language": "fr",
    "goals": [],
    "dietary_restrictions": [],
    "favorite_activities": [],
    "notification_preferences": {
      "email": true,
      "sms": false
    },
    "privacy_level": "standard"
  }'::jsonb,
  
  -- Statistiques d'Utilisation
  total_visits INTEGER DEFAULT 0,
  last_visit TIMESTAMP WITH TIME ZONE,
  last_jarvis_interaction TIMESTAMP WITH TIME ZONE,
  
  -- Notes & Contexte
  member_notes TEXT, -- Notes du staff
  emergency_contact JSONB, -- Contact d'urgence
  medical_notes TEXT, -- Informations médicales importantes
  
  -- Status & Flags
  is_active BOOLEAN DEFAULT true,
  can_use_jarvis BOOLEAN DEFAULT true,
  requires_assistance BOOLEAN DEFAULT false, -- Membre nécessitant aide spéciale
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 🔄 TABLE: member_visits (Tracking entrées)
-- ===========================================
CREATE TABLE IF NOT EXISTS member_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES gym_members(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  
  -- Détails de la visite
  visit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  entry_method VARCHAR(50) DEFAULT 'badge_scan', -- 'badge_scan', 'manual', 'mobile_app'
  badge_scanned VARCHAR(255), -- Badge utilisé pour cette visite
  
  -- Durée de séjour (optionnel)
  exit_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  
  -- Activités durant la visite
  activities_logged TEXT[], -- ['cardio', 'musculation', 'cours_yoga']
  jarvis_interactions INTEGER DEFAULT 0,
  
  -- Metadata
  visit_metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 🔗 INDEXES pour Performance
-- ===========================================

-- Index badge_id pour scans rapides
CREATE UNIQUE INDEX IF NOT EXISTS idx_gym_members_badge_id ON gym_members(badge_id);
CREATE INDEX IF NOT EXISTS idx_gym_members_gym_id ON gym_members(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_members_active ON gym_members(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_gym_members_email ON gym_members(email);

-- Index visits pour analytics
CREATE INDEX IF NOT EXISTS idx_member_visits_member_id ON member_visits(member_id);
CREATE INDEX IF NOT EXISTS idx_member_visits_date ON member_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_member_visits_gym_date ON member_visits(gym_id, visit_date);

-- ===========================================
-- 🛡️ ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE gym_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_visits ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Accès selon la salle/franchise
CREATE POLICY "gym_members_access_by_gym"
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

CREATE POLICY "member_visits_access_by_gym"
  ON member_visits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
    OR
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

-- ===========================================
-- 🔧 FONCTIONS UTILITAIRES
-- ===========================================

-- Fonction pour enregistrer une visite automatiquement
CREATE OR REPLACE FUNCTION log_member_visit(
  p_badge_id VARCHAR(255),
  p_gym_slug VARCHAR(255)
)
RETURNS TABLE(
  success BOOLEAN,
  member_data JSONB,
  visit_id UUID,
  message TEXT
) AS $$
DECLARE
  v_member_id UUID;
  v_gym_id UUID;
  v_visit_id UUID;
  v_member_data JSONB;
BEGIN
  -- 1. Trouver la salle par slug
  SELECT id INTO v_gym_id 
  FROM gyms 
  WHERE kiosk_config->>'kiosk_url_slug' = p_gym_slug;
  
  IF v_gym_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::jsonb, NULL::uuid, 'Salle introuvable'::text;
    RETURN;
  END IF;
  
  -- 2. Trouver le membre par badge
  SELECT id INTO v_member_id 
  FROM gym_members 
  WHERE badge_id = p_badge_id 
  AND gym_id = v_gym_id 
  AND is_active = true;
  
  IF v_member_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::jsonb, NULL::uuid, 'Badge non reconnu'::text;
    RETURN;
  END IF;
  
  -- 3. Enregistrer la visite
  INSERT INTO member_visits (member_id, gym_id, badge_scanned, jarvis_interactions)
  VALUES (v_member_id, v_gym_id, p_badge_id, 1)
  RETURNING id INTO v_visit_id;
  
  -- 4. Mettre à jour les stats du membre
  UPDATE gym_members 
  SET 
    total_visits = total_visits + 1,
    last_visit = NOW(),
    last_jarvis_interaction = NOW()
  WHERE id = v_member_id;
  
  -- 5. Récupérer les données complètes du membre
  SELECT row_to_json(m.*) INTO v_member_data
  FROM gym_members m
  WHERE m.id = v_member_id;
  
  -- 6. Retourner le succès avec données
  RETURN QUERY SELECT true, v_member_data, v_visit_id, 'Visite enregistrée avec succès'::text;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::jsonb, NULL::uuid, ('Erreur: ' || SQLERRM)::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 📊 DONNÉES DE TEST pour Développement
-- ===========================================

-- Insérer des membres de test pour la première salle trouvée
INSERT INTO gym_members (gym_id, badge_id, first_name, last_name, email, membership_type, member_preferences, total_visits, last_visit)
SELECT 
  g.id,
  'BADGE_001',
  'Pierre',
  'Martin', 
  'pierre.martin@email.com',
  'Premium',
  '{
    "language": "fr",
    "goals": ["Perte de poids", "Renforcement musculaire"],
    "favorite_activities": ["Cardio", "Musculation"],
    "notification_preferences": {"email": true, "sms": true}
  }'::jsonb,
  156,
  '2024-01-20 09:30:00'::timestamp
FROM gyms g 
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
  '{
    "language": "fr", 
    "goals": ["Flexibilité", "Bien-être"],
    "favorite_activities": ["Yoga", "Pilates"],
    "notification_preferences": {"email": true, "sms": false}
  }'::jsonb,
  87,
  '2024-01-19 18:45:00'::timestamp
FROM gyms g 
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
  '{
    "language": "en",
    "goals": ["Performance", "Gain musculaire"], 
    "favorite_activities": ["CrossFit", "Haltérophilie"],
    "notification_preferences": {"email": false, "sms": false}
  }'::jsonb,
  342,
  '2024-01-21 07:15:00'::timestamp
FROM gyms g 
LIMIT 1
ON CONFLICT (badge_id) DO NOTHING;

-- ===========================================
-- ✅ CRÉATION SCHEMA MEMBRES TERMINÉE
-- ===========================================

SELECT 'Schéma gym_members créé avec succès !' as status;
SELECT 'Fonction log_member_visit() créée pour API' as api_function;
SELECT 'Données de test Pierre, Sophie, Alex insérées' as test_data; 