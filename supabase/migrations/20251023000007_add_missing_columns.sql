-- ============================================================================
-- MIGRATION 007: ADD MISSING COLUMNS TO gym_members_v2
-- Date: 2025-10-23
-- Description: Ajoute les colonnes manquantes (last_visit, total_visits, etc.)
-- ============================================================================

-- Ajouter les colonnes manquantes à gym_members_v2
ALTER TABLE gym_members_v2
ADD COLUMN IF NOT EXISTS last_visit TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_visits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS can_use_jarvis BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS member_preferences JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS member_notes TEXT;

-- Créer un index sur last_visit pour les requêtes de visite récente
CREATE INDEX IF NOT EXISTS idx_gym_members_v2_last_visit 
  ON gym_members_v2(last_visit DESC) 
  WHERE last_visit IS NOT NULL;

-- Créer un index sur total_visits
CREATE INDEX IF NOT EXISTS idx_gym_members_v2_total_visits 
  ON gym_members_v2(total_visits DESC);

-- Créer un index GIN sur member_preferences pour les requêtes JSONB
CREATE INDEX IF NOT EXISTS idx_gym_members_v2_preferences 
  ON gym_members_v2 USING GIN (member_preferences);

-- Commentaires
COMMENT ON COLUMN gym_members_v2.last_visit IS 'Dernière visite du membre (auto-update par log_member_visit)';
COMMENT ON COLUMN gym_members_v2.total_visits IS 'Nombre total de visites (auto-increment par log_member_visit)';
COMMENT ON COLUMN gym_members_v2.can_use_jarvis IS 'Permission d''utiliser l''assistant vocal JARVIS';
COMMENT ON COLUMN gym_members_v2.member_preferences IS 'Préférences membres stockées en JSON (legacy compatibility)';
COMMENT ON COLUMN gym_members_v2.member_notes IS 'Notes libres sur le membre';

-- Mettre à jour les données depuis l'ancienne table si elle existe encore
-- DO $$
-- BEGIN
--   IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gym_members') THEN
--     UPDATE gym_members_v2 gm2
--     SET 
--       last_visit = gm.last_visit,
--       total_visits = gm.total_visits,
--       can_use_jarvis = gm.can_use_jarvis,
--       member_preferences = gm.member_preferences,
--       member_notes = gm.member_notes
--     FROM gym_members gm
--     WHERE gm2.id = gm.id
--       AND (gm.last_visit IS NOT NULL 
--         OR gm.total_visits IS NOT NULL 
--         OR gm.can_use_jarvis IS NOT NULL
--         OR gm.member_preferences IS NOT NULL
--         OR gm.member_notes IS NOT NULL);
--   END IF;
-- END$$;

