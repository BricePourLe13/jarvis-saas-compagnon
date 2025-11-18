-- ============================================================================
-- MIGRATION: REFONTE API FLOW - Suppression Franchises + Approval Workflow
-- Date: 2025-11-17
-- Description: 
--   1. Retirer franchise_id des gyms (concept supprimé)
--   2. Ajouter approval_status pour gyms et kiosks
--   3. Adapter manager_invitations (pas de gym_id obligatoire)
--   4. Ajouter constraints et indexes
-- ============================================================================

-- ============================================================================
-- 1. GYMS: Retirer franchise_id + Ajouter approval workflow
-- ============================================================================

-- Retirer contrainte et colonne franchise_id (legacy)
ALTER TABLE gyms 
  DROP CONSTRAINT IF EXISTS gyms_franchise_id_fkey;

ALTER TABLE gyms 
  DROP COLUMN IF EXISTS legacy_franchise_name;

-- Modifier status pour supporter approval workflow
-- Anciens: 'active', 'inactive', 'maintenance', 'suspended'
-- Nouveaux: 'pending_approval', 'active', 'suspended', 'cancelled'
ALTER TABLE gyms 
  ALTER COLUMN status TYPE TEXT;

-- Ajouter metadata approbation
ALTER TABLE gyms 
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Ajouter constraint sur status
ALTER TABLE gyms
  DROP CONSTRAINT IF EXISTS gyms_status_check;

ALTER TABLE gyms
  ADD CONSTRAINT gyms_status_check 
  CHECK (status IN ('pending_approval', 'active', 'suspended', 'cancelled'));

-- Index pour filtrage rapide gyms pending
CREATE INDEX IF NOT EXISTS idx_gyms_pending_approval 
  ON gyms(status, created_at) 
  WHERE status = 'pending_approval';

-- ============================================================================
-- 2. KIOSKS: Ajouter approval workflow
-- ============================================================================

-- Modifier status pour supporter approval
-- Anciens: 'online', 'offline', 'error', 'provisioning', 'maintenance'
-- Nouveaux: 'provisioning', 'pending_approval', 'online', 'offline', 'maintenance', 'error'
ALTER TABLE kiosks
  DROP CONSTRAINT IF EXISTS kiosks_status_check;

ALTER TABLE kiosks
  ADD CONSTRAINT kiosks_status_check 
  CHECK (status IN ('provisioning', 'pending_approval', 'online', 'offline', 'maintenance', 'error'));

-- Ajouter metadata approbation
ALTER TABLE kiosks
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS provisioning_code_expires_at TIMESTAMPTZ;

-- Ajouter expiration automatique code provisioning (48h par défaut)
UPDATE kiosks 
SET provisioning_code_expires_at = created_at + INTERVAL '48 hours'
WHERE provisioning_code_expires_at IS NULL 
  AND status IN ('provisioning', 'pending_approval');

-- Index pour kiosks pending
CREATE INDEX IF NOT EXISTS idx_kiosks_pending_approval 
  ON kiosks(status, created_at) 
  WHERE status = 'pending_approval';

-- Index pour codes expiré (cleanup)
CREATE INDEX IF NOT EXISTS idx_kiosks_expired_codes 
  ON kiosks(provisioning_code_expires_at) 
  WHERE status = 'provisioning' 
    AND provisioning_code_expires_at IS NOT NULL;

-- ============================================================================
-- 3. MANAGER_INVITATIONS: Rendre gym_id optionnel
-- ============================================================================

-- Retirer contrainte NOT NULL sur gym_id
-- (invitation peut exister avant création gym)
ALTER TABLE manager_invitations
  ALTER COLUMN gym_id DROP NOT NULL;

-- Ajouter statut invitation explicite
ALTER TABLE manager_invitations
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'accepted', 'expired', 'revoked'));

-- Mettre à jour invitations existantes acceptées
UPDATE manager_invitations
SET status = 'accepted'
WHERE accepted_at IS NOT NULL;

-- Mettre à jour invitations expirées
UPDATE manager_invitations
SET status = 'expired'
WHERE expires_at < NOW() AND accepted_at IS NULL;

-- ============================================================================
-- 4. FUNCTIONS: Auto-expiration codes provisioning
-- ============================================================================

CREATE OR REPLACE FUNCTION expire_old_provisioning_codes()
RETURNS void AS $$
BEGIN
  UPDATE kiosks
  SET status = 'error',
      notes = 'Code provisioning expiré - Générer un nouveau code'
  WHERE status = 'provisioning'
    AND provisioning_code_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. COMMENTS (Documentation)
-- ============================================================================

COMMENT ON COLUMN gyms.status IS 'pending_approval: En attente validation admin | active: Opérationnelle | suspended: Suspendue | cancelled: Annulée';
COMMENT ON COLUMN gyms.approved_at IS 'Date d''approbation par super admin';
COMMENT ON COLUMN gyms.approved_by IS 'ID du super admin qui a approuvé';

COMMENT ON COLUMN kiosks.status IS 'provisioning: Setup initial | pending_approval: En attente validation | online: Actif | offline: Hors ligne | maintenance: Maintenance | error: Erreur';
COMMENT ON COLUMN kiosks.approved_at IS 'Date d''approbation par admin';
COMMENT ON COLUMN kiosks.provisioning_code_expires_at IS 'Date expiration code (48h par défaut)';

COMMENT ON COLUMN manager_invitations.gym_id IS 'Optionnel - Peut être NULL si invitation avant création gym';
COMMENT ON COLUMN manager_invitations.status IS 'pending: En attente | accepted: Acceptée | expired: Expirée | revoked: Révoquée';

-- ============================================================================
-- 6. DATA MIGRATION: Mettre à jour gyms existantes
-- ============================================================================

-- Passer toutes les gyms 'active' existantes en 'active' (déjà approuvées implicitement)
UPDATE gyms
SET 
  status = 'active',
  approved_at = created_at,
  approved_by = (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
WHERE status = 'active';

-- ============================================================================
-- FIN MIGRATION
-- ============================================================================


