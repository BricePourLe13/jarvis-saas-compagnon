-- ============================================================================
-- MIGRATION 009: AJOUTER gym_id À users
-- Date: 2025-10-23
-- Description: Ajoute la colonne gym_id pour les gym managers/staff
-- ============================================================================

-- Ajouter la colonne gym_id
ALTER TABLE users
ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES gyms(id) ON DELETE SET NULL;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_users_gym_id ON users(gym_id) WHERE gym_id IS NOT NULL;

-- Commentaire
COMMENT ON COLUMN users.gym_id IS 'Salle de rattachement pour gym_manager et staff';

