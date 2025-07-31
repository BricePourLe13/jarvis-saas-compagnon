-- ===========================================
-- 🔧 FIX RAPIDE: Colonne last_login
-- ===========================================
-- Choix: Renommer last_login_at en last_login pour cohérence code

DO $$
BEGIN
    -- Vérifier et renommer si nécessaire
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_login_at'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_login'
    ) THEN
        ALTER TABLE users RENAME COLUMN last_login_at TO last_login;
        RAISE NOTICE '✅ Colonne last_login_at renommée en last_login';
    ELSE
        RAISE NOTICE 'ℹ️  Colonne last_login existe déjà ou last_login_at introuvable';
    END IF;
END $$;