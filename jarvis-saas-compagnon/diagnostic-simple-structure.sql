-- ===========================================
-- 🔍 DIAGNOSTIC SIMPLE - STRUCTURE EXACTE
-- ===========================================
-- Juste voir ce qui existe vraiment !

-- 1. Voir TOUTES les colonnes de la table users
SELECT 
    '📋 COLONNES TABLE USERS' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Voir si la table users existe
SELECT 
    '🗂️ TABLE EXISTS?' as section,
    count(*) as table_count
FROM information_schema.tables 
WHERE table_name = 'users' AND table_schema = 'public';

-- 3. Compter les lignes dans users (si la table existe)
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    BEGIN
        SELECT count(*) INTO user_count FROM users;
        RAISE NOTICE '👥 Nombre d''utilisateurs dans la table: %', user_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Erreur accès table users: %', SQLERRM;
    END;
END $$;

-- 4. Voir toutes les tables du schéma public
SELECT 
    '🗂️ TOUTES LES TABLES PUBLIC' as section,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;