-- ===========================================
-- 🔍 DIAGNOSTIC COMPLET SUPABASE - JARVIS
-- ===========================================
-- À exécuter dans: Dashboard Supabase > SQL Editor
-- But: Diagnostiquer problème "Invalid login credentials"

DO $$
BEGIN
    RAISE NOTICE '🔍 ===========================================';
    RAISE NOTICE '🔍 DIAGNOSTIC SUPABASE COMPLET - DÉMARRAGE';
    RAISE NOTICE '🔍 ===========================================';
END $$;

-- ===========================================
-- 1. 📊 INFORMATIONS GÉNÉRALES DATABASE
-- ===========================================
SELECT 
    '📊 DATABASE INFO' as section,
    current_database() as database_name,
    current_user as current_user,
    version() as postgres_version,
    now() as current_timestamp;

-- ===========================================
-- 2. 🔐 CONFIGURATION AUTH SUPABASE
-- ===========================================
-- Note: Ces tables sont dans le schéma 'auth' si accessible
SELECT 
    '🔐 AUTH CONFIG' as section,
    'Tentative lecture config auth...' as status;

-- Essayer de lire les utilisateurs auth (peut échouer selon permissions)
DO $$
BEGIN
    BEGIN
        -- Compter les utilisateurs dans auth.users
        RAISE NOTICE '👥 Nombre utilisateurs auth.users: %', (SELECT count(*) FROM auth.users);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Impossible accéder auth.users: %', SQLERRM;
    END;
END $$;

-- ===========================================
-- 3. 👥 ANALYSE TABLE USERS (public.users)
-- ===========================================
SELECT 
    '👥 PUBLIC USERS ANALYSIS' as section,
    count(*) as total_users,
    count(*) FILTER (WHERE is_active = true) as active_users,
    count(*) FILTER (WHERE is_active = false) as inactive_users,
    count(*) FILTER (WHERE role = 'super_admin') as super_admins,
    count(*) FILTER (WHERE role = 'franchise_owner') as franchise_owners,
    count(*) FILTER (WHERE role = 'franchise_admin') as franchise_admins
FROM users;

-- Détails des utilisateurs
SELECT 
    '👤 USER DETAILS' as section,
    email,
    full_name,
    role,
    is_active,
    last_login_at,
    created_at,
    updated_at
FROM users
ORDER BY created_at DESC;

-- ===========================================
-- 4. 🗂️ STRUCTURE TABLES
-- ===========================================
SELECT 
    '🗂️ TABLES STRUCTURE' as section,
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname IN ('public', 'auth')
ORDER BY schemaname, tablename;

-- Colonnes de la table users
SELECT 
    '📋 USERS TABLE COLUMNS' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ===========================================
-- 5. 🔑 ENUM TYPES
-- ===========================================
SELECT 
    '🔑 ENUM TYPES' as section,
    t.typname as enum_name,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%role%' OR t.typname LIKE '%status%'
GROUP BY t.typname;

-- ===========================================
-- 6. 🛡️ RLS POLICIES
-- ===========================================
SELECT 
    '🛡️ RLS POLICIES' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ===========================================
-- 7. 🔍 RECHERCHE UTILISATEUR SPÉCIFIQUE
-- ===========================================
-- Recherche par email (remplace par ton email)
DO $$
DECLARE
    target_email TEXT := 'brice@jarvis-group.net'; -- CHANGE TON EMAIL ICI
    user_record RECORD;
BEGIN
    RAISE NOTICE '🔍 ===========================================';
    RAISE NOTICE '🔍 RECHERCHE UTILISATEUR: %', target_email;
    RAISE NOTICE '🔍 ===========================================';
    
    -- Recherche dans public.users
    SELECT * INTO user_record FROM users WHERE email = target_email;
    
    IF FOUND THEN
        RAISE NOTICE '✅ Trouvé dans public.users:';
        RAISE NOTICE '   ID: %', user_record.id;
        RAISE NOTICE '   Email: %', user_record.email;
        RAISE NOTICE '   Nom: %', user_record.full_name;
        RAISE NOTICE '   Rôle: %', user_record.role;
        RAISE NOTICE '   Actif: %', user_record.is_active;
        RAISE NOTICE '   Dernière connexion: %', user_record.last_login_at;
        RAISE NOTICE '   Créé: %', user_record.created_at;
    ELSE
        RAISE NOTICE '❌ UTILISATEUR NON TROUVÉ dans public.users';
    END IF;
    
    -- Tentative recherche dans auth.users (peut échouer)
    BEGIN
        EXECUTE format('SELECT count(*) FROM auth.users WHERE email = %L', target_email) INTO user_record;
        RAISE NOTICE '👤 Présent dans auth.users: % occurence(s)', user_record.count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Impossible vérifier auth.users: %', SQLERRM;
    END;
END $$;

-- ===========================================
-- 8. 📧 ANALYSE DES INVITATIONS
-- ===========================================
-- Chercher des traces d'invitations récentes
SELECT 
    '📧 RECENT LOGS' as section,
    type,
    details,
    timestamp
FROM jarvis_errors_log 
WHERE type LIKE '%invitation%' OR type LIKE '%auth%'
ORDER BY timestamp DESC 
LIMIT 10;

-- ===========================================
-- 9. 🔧 CONFIGURATION SUGGESTIONS
-- ===========================================
DO $$
BEGIN
    RAISE NOTICE '🔧 ===========================================';
    RAISE NOTICE '🔧 SUGGESTIONS DE CONFIGURATION';
    RAISE NOTICE '🔧 ===========================================';
    
    -- Vérifier RLS activé
    IF EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'users' AND rowsecurity = true) THEN
        RAISE NOTICE '✅ RLS activé sur table users';
    ELSE
        RAISE NOTICE '⚠️  RLS potentiellement désactivé sur table users';
    END IF;
    
    -- Compter les super admins
    IF (SELECT count(*) FROM users WHERE role = 'super_admin' AND is_active = true) = 0 THEN
        RAISE NOTICE '🚨 AUCUN SUPER ADMIN ACTIF trouvé !';
    ELSE
        RAISE NOTICE '✅ Super admin(s) actif(s) trouvé(s)';
    END IF;
    
    RAISE NOTICE '🔧 ===========================================';
    RAISE NOTICE '🔧 FIN DU DIAGNOSTIC';
    RAISE NOTICE '🔧 ===========================================';
END $$;

-- ===========================================
-- 10. 🚨 ACTIONS RECOMMANDÉES
-- ===========================================
SELECT 
    '🚨 NEXT STEPS' as section,
    'Vérifiez les résultats ci-dessus et cherchez:' as instructions UNION ALL
SELECT 
    '🚨 NEXT STEPS' as section,
    '1. Votre email dans public.users' as instructions UNION ALL
SELECT 
    '🚨 NEXT STEPS' as section,
    '2. is_active = true pour votre compte' as instructions UNION ALL
SELECT 
    '🚨 NEXT STEPS' as section,
    '3. role = super_admin correct' as instructions UNION ALL
SELECT 
    '🚨 NEXT STEPS' as section,
    '4. Policies RLS qui pourraient bloquer' as instructions;