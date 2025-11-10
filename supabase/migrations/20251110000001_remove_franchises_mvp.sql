-- ============================================
-- MIGRATION : Suppression système franchises pour MVP
-- Date : 10 Novembre 2025
-- Version : 1.0
-- ============================================
-- OBJECTIF : Simplifier l'architecture à 2 rôles (super_admin + gym_manager)
-- ============================================

-- ============================================
-- ÉTAPE 1 : BACKUP DATA (PRÉSERVER INFOS FRANCHISE)
-- ============================================

-- Ajouter colonne temporaire dans gyms pour préserver nom franchise
ALTER TABLE public.gyms 
ADD COLUMN IF NOT EXISTS legacy_franchise_name TEXT;

-- Copier noms franchises dans gyms (pour analytics historiques)
UPDATE public.gyms g
SET legacy_franchise_name = f.name
FROM public.franchises f
WHERE g.franchise_id = f.id;

COMMENT ON COLUMN public.gyms.legacy_franchise_name IS 'Nom de la franchise d''origine (avant migration MVP)';

-- Vérification backup data
DO $$
DECLARE
  gyms_with_franchise_name INTEGER;
BEGIN
  SELECT COUNT(*) INTO gyms_with_franchise_name
  FROM public.gyms
  WHERE legacy_franchise_name IS NOT NULL;
  
  RAISE NOTICE 'Gyms avec legacy_franchise_name préservé : %', gyms_with_franchise_name;
END $$;

-- ============================================
-- ÉTAPE 2 : MIGRER USERS (ROLES FRANCHISE → GYM_MANAGER)
-- ============================================

-- Migrer franchise_owner et franchise_admin → gym_manager
UPDATE public.users
SET role = 'gym_manager'
WHERE role IN ('franchise_owner', 'franchise_admin');

-- Vérification migration users
DO $$
DECLARE
  migrated_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_users
  FROM public.users
  WHERE role = 'gym_manager';
  
  RAISE NOTICE 'Users migrés vers gym_manager : %', migrated_users;
  
  -- S'assurer qu'aucun role franchise ne reste
  IF EXISTS (SELECT 1 FROM public.users WHERE role IN ('franchise_owner', 'franchise_admin')) THEN
    RAISE EXCEPTION 'Erreur: Des users ont encore un role franchise!';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 3 : NETTOYER COLONNES FRANCHISE DANS USERS
-- ============================================

-- Supprimer colonne franchise_id (non utilisée selon audit)
ALTER TABLE public.users 
DROP COLUMN IF EXISTS franchise_id;

-- Supprimer colonne franchise_access (non utilisée)
ALTER TABLE public.users 
DROP COLUMN IF EXISTS franchise_access;

-- ============================================
-- ÉTAPE 4 : MODIFIER ENUM user_role (SUPPRIMER ROLES FRANCHISE)
-- ============================================

-- Créer nouveau enum sans roles franchise
CREATE TYPE user_role_new AS ENUM ('super_admin', 'gym_manager');

-- Migrer colonne role vers nouveau enum
ALTER TABLE public.users 
ALTER COLUMN role TYPE user_role_new USING role::text::user_role_new;

-- Supprimer ancien enum
DROP TYPE IF EXISTS user_role;

-- Renommer nouveau enum
ALTER TYPE user_role_new RENAME TO user_role;

-- ============================================
-- ÉTAPE 5 : NETTOYER FOREIGN KEYS FRANCHISE
-- ============================================

-- Supprimer FK gyms.franchise_id → franchises.id
ALTER TABLE public.gyms 
DROP CONSTRAINT IF EXISTS gyms_franchise_id_fkey;

-- Supprimer FK jarvis_session_costs.franchise_id → franchises.id
ALTER TABLE public.jarvis_session_costs 
DROP CONSTRAINT IF EXISTS jarvis_session_costs_franchise_id_fkey;

-- ============================================
-- ÉTAPE 6 : SUPPRIMER COLONNES FRANCHISE_ID
-- ============================================

-- Supprimer colonne franchise_id de gyms
ALTER TABLE public.gyms 
DROP COLUMN IF EXISTS franchise_id;

-- Supprimer colonne franchise_id de jarvis_session_costs
ALTER TABLE public.jarvis_session_costs 
DROP COLUMN IF EXISTS franchise_id;

-- Supprimer colonne franchise_id de openai_realtime_sessions
ALTER TABLE public.openai_realtime_sessions 
DROP COLUMN IF EXISTS franchise_id;

-- Vérifier que kiosk_sessions a bien gym_id (pas franchise_id)
-- (selon audit : kiosk_sessions.franchise_id devrait être kiosk_sessions.gym_id)
-- Si nécessaire :
-- ALTER TABLE public.kiosk_sessions RENAME COLUMN franchise_id TO gym_id;

-- ============================================
-- ÉTAPE 7 : SUPPRIMER RLS POLICIES FRANCHISE
-- ============================================

-- Supprimer policies mentionnant franchise_owner/franchise_admin
-- Gyms
DROP POLICY IF EXISTS "Franchise owners can view their gyms" ON public.gyms;
DROP POLICY IF EXISTS "Franchise owners can update their gyms" ON public.gyms;
DROP POLICY IF EXISTS "Franchise admins can view gyms" ON public.gyms;

-- Users
DROP POLICY IF EXISTS "Franchise owners can view their users" ON public.users;
DROP POLICY IF EXISTS "Franchise owners can update their users" ON public.users;

-- Jarvis session costs
DROP POLICY IF EXISTS "Franchise owners can view their session costs" ON public.jarvis_session_costs;

-- Kiosks
DROP POLICY IF EXISTS "Franchise owners can view their kiosks" ON public.kiosks;

-- Members
DROP POLICY IF EXISTS "Franchise owners can view members" ON public.gym_members_v2;

-- ============================================
-- ÉTAPE 8 : SUPPRIMER TABLE FRANCHISES
-- ============================================

DROP TABLE IF EXISTS public.franchises CASCADE;

-- ============================================
-- ÉTAPE 9 : CRÉER/METTRE À JOUR POLICIES MVP (2 ROLES)
-- ============================================

-- GYMS : super_admin voit tout, gym_manager voit ses salles
DROP POLICY IF EXISTS "Super admin can view all gyms" ON public.gyms;
CREATE POLICY "Super admin can view all gyms" ON public.gyms
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Gym manager can view their gyms" ON public.gyms;
CREATE POLICY "Gym manager can view their gyms" ON public.gyms
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'gym_manager'
      AND (
        users.gym_id = gyms.id
        OR gyms.id = ANY(users.gym_access)
      )
    )
  );

-- USERS : super_admin voit tout, gym_manager voit utilisateurs de ses salles
DROP POLICY IF EXISTS "Super admin can view all users" ON public.users;
CREATE POLICY "Super admin can view all users" ON public.users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Gym manager can view their gym users" ON public.users;
CREATE POLICY "Gym manager can view their gym users" ON public.users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'gym_manager'
      AND (
        u.gym_id = users.gym_id
        OR users.gym_id = ANY(u.gym_access)
      )
    )
  );

-- MEMBERS : super_admin voit tout, gym_manager voit membres de ses salles
DROP POLICY IF EXISTS "Super admin can view all members" ON public.gym_members_v2;
CREATE POLICY "Super admin can view all members" ON public.gym_members_v2
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Gym manager can view their gym members" ON public.gym_members_v2;
CREATE POLICY "Gym manager can view their gym members" ON public.gym_members_v2
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'gym_manager'
      AND (
        users.gym_id = gym_members_v2.gym_id
        OR gym_members_v2.gym_id = ANY(users.gym_access)
      )
    )
  );

-- ============================================
-- ÉTAPE 10 : VÉRIFICATIONS FINALES
-- ============================================

DO $$
DECLARE
  franchises_count INTEGER;
  franchise_columns INTEGER;
  franchise_users INTEGER;
BEGIN
  -- Vérifier table franchises supprimée
  SELECT COUNT(*) INTO franchises_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'franchises';
  
  IF franchises_count > 0 THEN
    RAISE EXCEPTION 'ERREUR: Table franchises existe encore!';
  END IF;
  
  -- Vérifier colonnes franchise_id supprimées
  SELECT COUNT(*) INTO franchise_columns
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND column_name = 'franchise_id';
  
  IF franchise_columns > 0 THEN
    RAISE WARNING 'ATTENTION: % colonnes franchise_id restantes', franchise_columns;
  END IF;
  
  -- Vérifier plus de users franchise
  SELECT COUNT(*) INTO franchise_users
  FROM public.users
  WHERE role::text IN ('franchise_owner', 'franchise_admin');
  
  IF franchise_users > 0 THEN
    RAISE EXCEPTION 'ERREUR: % users avec role franchise restants!', franchise_users;
  END IF;
  
  RAISE NOTICE '✅ MIGRATION COMPLÉTÉE AVEC SUCCÈS!';
  RAISE NOTICE 'Franchises supprimées, colonnes franchise_id retirées, users migrés vers gym_manager';
END $$;

