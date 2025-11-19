-- ============================================================================
-- Migration: Auto-création users via trigger Auth
-- Date: 2025-11-19
-- Description: Pattern officiel Supabase pour synchroniser auth.users → public.users
-- Référence: https://supabase.com/docs/guides/auth/managing-user-data
-- ============================================================================

-- 1. Créer fonction qui auto-insert dans public.users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insérer automatiquement dans public.users quand Auth user créé
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    gym_id,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'gym_manager'),
    (NEW.raw_user_meta_data->>'gym_id')::uuid,
    true,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$;

-- 2. Créer trigger sur auth.users (AFTER INSERT)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 3. Commenter pour documentation
COMMENT ON FUNCTION public.handle_new_auth_user() IS 
  'Trigger function: Auto-crée une entrée dans public.users quand un user Auth est créé. Pattern officiel Supabase.';

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
  'Synchronise automatiquement auth.users → public.users lors de la création d''un compte.';

-- 4. Log migration
INSERT INTO system_logs (log_type, message, details)
VALUES (
  'migration',
  'Trigger Auth → Users créé',
  jsonb_build_object(
    'trigger_name', 'on_auth_user_created',
    'function_name', 'handle_new_auth_user',
    'pattern', 'official_supabase',
    'reference', 'https://supabase.com/docs/guides/auth/managing-user-data'
  )
);

