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
-- ÉTAPE 2 : MIGRER USERS (TOUS ROLES → 2 ROLES MVP)
-- ============================================

-- Migrer franchise_owner, franchise_admin, gym_staff → gym_manager
UPDATE public.users
SET role = 'gym_manager'
WHERE role IN ('franchise_owner', 'franchise_admin', 'gym_staff');

-- Vérification migration users
DO $$
DECLARE
  migrated_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_users
  FROM public.users
  WHERE role = 'gym_manager';
  
  RAISE NOTICE 'Users migrés vers gym_manager : %', migrated_users;
  
  -- S'assurer qu'aucun ancien role ne reste
  IF EXISTS (SELECT 1 FROM public.users WHERE role IN ('franchise_owner', 'franchise_admin', 'gym_staff')) THEN
    RAISE EXCEPTION 'Erreur: Des users ont encore un ancien role!';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 3 : DROP **TOUTES** POLICIES + VIEWS (~50 policies + vues dépendent de users.role!)
-- ============================================

-- CRITIQUE : Policies ET vues référencent users.role et bloquent ALTER TYPE
-- Solution : Drop tout, modifier enum, recréer uniquement MVP

-- 3.1: Drop policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
  RAISE NOTICE 'Toutes les policies public.* supprimées';
END $$;

-- 3.2: Drop views (incluant v_admins_missing_mfa qui bloque ALTER TYPE)
DROP VIEW IF EXISTS public.v_sessions_today CASCADE;
DROP VIEW IF EXISTS public.v_openai_realtime_active_sessions_v2 CASCADE;
DROP VIEW IF EXISTS public.v_kiosk_status CASCADE;
DROP VIEW IF EXISTS public.franchises_compat CASCADE;
DROP VIEW IF EXISTS public.gyms_compat CASCADE;
DROP VIEW IF EXISTS public.v_admins_missing_mfa CASCADE;
DROP VIEW IF EXISTS public.jarvis_unified_costs CASCADE;
DROP VIEW IF EXISTS public.kiosk_monitoring_unified CASCADE;

-- ============================================
-- ÉTAPE 4 : SUPPRIMER TABLE FRANCHISES (CASCADE AUTO-SUPPRIME SES POLICIES)
-- ============================================

DROP TABLE IF EXISTS public.franchises CASCADE;

-- ============================================
-- ÉTAPE 5 : MAINTENANT NETTOYER COLONNES FRANCHISE DANS USERS
-- ============================================

-- Supprimer colonne franchise_id (safe après DROP TABLE franchises)
ALTER TABLE public.users 
DROP COLUMN IF EXISTS franchise_id CASCADE;

-- Supprimer colonne franchise_access (safe après DROP TABLE franchises)
ALTER TABLE public.users 
DROP COLUMN IF EXISTS franchise_access;

-- ============================================
-- ÉTAPE 6 : MODIFIER ENUM user_role (SUPPRIMER ROLES FRANCHISE)
-- ============================================

-- 6.1: Supprimer DEFAULT temporairement (sinon cast error)
ALTER TABLE public.users ALTER COLUMN role DROP DEFAULT;

-- 6.2: Créer nouveau enum MVP (super_admin, gym_manager, member pour app)
CREATE TYPE user_role_new AS ENUM ('super_admin', 'gym_manager', 'member');

-- 6.3: Migrer colonne role vers nouveau enum
ALTER TABLE public.users 
ALTER COLUMN role TYPE user_role_new USING role::text::user_role_new;

-- 6.4: Supprimer ancien enum
DROP TYPE IF EXISTS user_role;

-- 6.5: Renommer nouveau enum
ALTER TYPE user_role_new RENAME TO user_role;

-- 6.6: Remettre DEFAULT avec nouvelle valeur
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'gym_manager'::user_role;

-- ============================================
-- ÉTAPE 7 : NETTOYER FOREIGN KEYS FRANCHISE
-- ============================================

-- Supprimer FK gyms.franchise_id → franchises.id
ALTER TABLE public.gyms 
DROP CONSTRAINT IF EXISTS gyms_franchise_id_fkey;

-- Supprimer FK jarvis_session_costs.franchise_id → franchises.id
ALTER TABLE public.jarvis_session_costs 
DROP CONSTRAINT IF EXISTS jarvis_session_costs_franchise_id_fkey;

-- ============================================
-- ÉTAPE 8 : SUPPRIMER COLONNES FRANCHISE_ID
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
-- ÉTAPE 9 : CRÉER/METTRE À JOUR POLICIES MVP (2 ROLES)
-- ============================================

-- NOTE : Toutes les anciennes policies ont été supprimées en ÉTAPE 3

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

-- KIOSKS : super_admin ALL, gym_manager leur gym, anon lecture si online
CREATE POLICY "kiosks_super_admin_all" ON public.kiosks FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'super_admin'));
CREATE POLICY "kiosks_gym_manager_view" ON public.kiosks FOR SELECT TO authenticated USING (gym_id IN (SELECT users.gym_id FROM users WHERE users.id = auth.uid() UNION SELECT unnest(gym_access) FROM users WHERE users.id = auth.uid()));
CREATE POLICY "kiosks_anon_view_online" ON public.kiosks FOR SELECT TO anon USING (status = 'online');

-- KIOSK MONITORING : anon ALL (heartbeats + metrics)
CREATE POLICY "kiosk_heartbeats_anon_all" ON public.kiosk_heartbeats FOR ALL TO anon USING (true);
CREATE POLICY "kiosk_metrics_anon_all" ON public.kiosk_metrics FOR ALL TO anon USING (true);

-- JARVIS ERRORS/SESSIONS : super_admin lecture, anon écriture
CREATE POLICY "jarvis_errors_authenticated" ON public.jarvis_errors_log FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'super_admin'));
CREATE POLICY "jarvis_errors_anon_insert" ON public.jarvis_errors_log FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "openai_sessions_authenticated" ON public.openai_realtime_sessions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'super_admin'));
CREATE POLICY "openai_sessions_anon_all" ON public.openai_realtime_sessions FOR ALL TO anon USING (true);

-- VITRINE DEMO : libre accès
CREATE POLICY "vitrine_demo_anon_all" ON public.vitrine_demo_sessions FOR ALL TO anon USING (true);

-- SYSTEM LOGS : authenticated lecture
CREATE POLICY "system_logs_authenticated" ON public.system_logs FOR SELECT TO authenticated USING (auth.role() = 'authenticated');

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

