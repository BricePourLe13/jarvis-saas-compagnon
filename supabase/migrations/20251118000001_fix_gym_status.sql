-- ============================================================================
-- MIGRATION: Fix gym status (online → active)
-- Date: 2025-11-18
-- Description: Les gyms existantes avaient status 'online' qui n'est plus valide
-- ============================================================================

-- 1. Mettre à jour les gyms avec status invalide (NULL, 'online', etc.)
UPDATE gyms
SET 
  status = 'active',
  approved_at = COALESCE(approved_at, created_at),
  approved_by = COALESCE(
    approved_by,
    (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
  )
WHERE 
  status IS NULL 
  OR status NOT IN ('pending_approval', 'active', 'suspended', 'cancelled');

-- 2. Log pour debug
DO $$
DECLARE
  updated_count INT;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ Migré % gyms vers status "active"', updated_count;
END $$;

