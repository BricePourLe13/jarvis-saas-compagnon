-- ===========================================
-- 🚨 DEBUG: Bug invitation mélange comptes
-- ===========================================

-- 1. Voir TOUS les utilisateurs avec ces emails
SELECT 
    '👥 UTILISATEURS CONCERNÉS' as section,
    id,
    email,
    full_name,
    role,
    is_active,
    invitation_status,
    created_at,
    updated_at
FROM users 
WHERE email IN ('brice@jarvis-group.net', 'brice.pradet@gmail.com')
ORDER BY email, created_at;

-- 2. Chercher des doublons d'UUID
SELECT 
    '🔍 DOUBLONS UUID' as section,
    id,
    count(*) as count_emails,
    string_agg(email, ', ') as emails
FROM users 
WHERE email IN ('brice@jarvis-group.net', 'brice.pradet@gmail.com')
GROUP BY id
HAVING count(*) > 1;

-- 3. Logs d'invitations récentes (vérification structure)
DO $$
BEGIN
    -- Vérifier si la table jarvis_errors_log existe et ses colonnes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jarvis_errors_log') THEN
        RAISE NOTICE '📧 Table jarvis_errors_log existe';
        
        -- Essayer de lire quelques logs récents
        BEGIN
            PERFORM * FROM jarvis_errors_log LIMIT 1;
            RAISE NOTICE '📧 Table accessible, regardons les logs...';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Erreur accès jarvis_errors_log: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE '❌ Table jarvis_errors_log introuvable';
    END IF;
END $$;

-- 4. Vérifier dans auth.users (si accessible)
DO $$
DECLARE
    brice_main_count INTEGER;
    brice_gmail_count INTEGER;
BEGIN
    BEGIN
        -- Compter dans auth.users
        SELECT count(*) INTO brice_main_count 
        FROM auth.users 
        WHERE email = 'brice@jarvis-group.net';
        
        SELECT count(*) INTO brice_gmail_count 
        FROM auth.users 
        WHERE email = 'brice.pradet@gmail.com';
        
        RAISE NOTICE '👤 auth.users - brice@jarvis-group.net: % compte(s)', brice_main_count;
        RAISE NOTICE '👤 auth.users - brice.pradet@gmail.com: % compte(s)', brice_gmail_count;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Impossible accéder auth.users: %', SQLERRM;
    END;
END $$;