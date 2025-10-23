-- ============================================================================
-- MIGRATION 010: FIX update_user_activity TRIGGER
-- Date: 2025-10-23
-- Description: Corriger le search_path du trigger qui causait des 500
-- ============================================================================

-- Recréer la fonction avec le bon search_path
CREATE OR REPLACE FUNCTION public.update_user_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'  -- ✅ AJOUTER 'public' !
AS $$
BEGIN
  -- Mettre à jour l'activité lors de la connexion
  IF TG_OP = 'UPDATE' AND OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at THEN
    UPDATE public.users 
    SET 
      last_activity_at = NOW(),
      login_count = COALESCE(login_count, 0) + 1
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Ne pas bloquer l'authentification si erreur
    RAISE WARNING 'Erreur update_user_activity: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Commentaire
COMMENT ON FUNCTION public.update_user_activity() IS 'Met à jour last_activity_at et login_count lors de la connexion';

