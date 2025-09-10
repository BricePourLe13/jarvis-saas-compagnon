-- 🔒 CORRECTIONS SÉCURITÉ PRODUCTION
-- Applique les corrections critiques avant déploiement

-- 1. Supprimer la table badge_auth obsolète (RLS manquant)
DROP TABLE IF EXISTS public.badge_auth CASCADE;

-- 2. Sécuriser les fonctions avec search_path
-- Fonction: create_session_with_member
ALTER FUNCTION public.create_session_with_member(text, text, text) 
SET search_path = public, pg_temp;

-- Fonction: close_session_robust
ALTER FUNCTION public.close_session_robust(text, text) 
SET search_path = public, pg_temp;

-- Fonction: cleanup_expired_invitations
ALTER FUNCTION public.cleanup_expired_invitations() 
SET search_path = public, pg_temp;

-- Fonction: calculate_personalization_score
ALTER FUNCTION public.calculate_personalization_score(uuid) 
SET search_path = public, pg_temp;

-- Fonction: increment_session_interruptions
ALTER FUNCTION public.increment_session_interruptions(text) 
SET search_path = public, pg_temp;

-- Fonction: cleanup_old_errors
ALTER FUNCTION public.cleanup_old_errors() 
SET search_path = public, pg_temp;

-- Fonction: validate_badge_auth (si encore utilisée)
ALTER FUNCTION public.validate_badge_auth(text, text) 
SET search_path = public, pg_temp;

-- Fonction: log_enterprise_action
ALTER FUNCTION public.log_enterprise_action(uuid, text, jsonb) 
SET search_path = public, pg_temp;

-- Fonction: close_realtime_session
ALTER FUNCTION public.close_realtime_session(text, text) 
SET search_path = public, pg_temp;

-- Fonction: handle_new_user
ALTER FUNCTION public.handle_new_user() 
SET search_path = public, pg_temp;

-- Fonction: update_personalization_score
ALTER FUNCTION public.update_personalization_score(uuid, numeric) 
SET search_path = public, pg_temp;

-- Fonction: _cron_cleanup_sessions
ALTER FUNCTION public._cron_cleanup_sessions() 
SET search_path = public, pg_temp;

-- Fonction: generate_kiosk_provisioning_code
ALTER FUNCTION public.generate_kiosk_provisioning_code(uuid) 
SET search_path = public, pg_temp;

-- Fonction: update_session_activity
ALTER FUNCTION public.update_session_activity(text) 
SET search_path = public, pg_temp;

-- Fonction: log_member_visit
ALTER FUNCTION public.log_member_visit(uuid, uuid) 
SET search_path = public, pg_temp;

-- 3. Vérifier que toutes les tables publiques ont RLS activé
-- (Cette requête liste les tables sans RLS pour audit)
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false
ORDER BY tablename;

-- 4. Activer RLS sur les tables critiques si pas déjà fait
-- (Décommenté seulement si nécessaire après vérification)
-- ALTER TABLE public.gym_members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.openai_realtime_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.jarvis_conversation_logs ENABLE ROW LEVEL SECURITY;

-- 5. Audit final des permissions
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public'
AND grantee NOT IN ('postgres', 'supabase_admin')
ORDER BY table_name, grantee;
