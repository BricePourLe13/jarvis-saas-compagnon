-- ============================================================================
-- MIGRATION 011: DÉSACTIVER TEMPORAIREMENT update_user_activity_trigger
-- Date: 2025-10-23
-- Description: Désactiver le trigger pour identifier s'il cause le 500
-- ============================================================================

-- Désactiver le trigger (TEMPORAIRE pour debug)
DROP TRIGGER IF EXISTS update_user_activity_trigger ON auth.users;

-- Note: Si le login fonctionne après ça, on le réactivera avec un fix
COMMENT ON FUNCTION public.update_user_activity() IS 'DÉSACTIVÉ TEMPORAIREMENT - Trigger retiré pour debug 500';

