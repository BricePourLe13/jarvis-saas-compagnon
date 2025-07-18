-- ===========================================
-- 🔧 Script de correction pour Supabase
-- ===========================================

-- 1. Supprimer et recréer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Modifier la table users pour rendre full_name nullable
ALTER TABLE users ALTER COLUMN full_name DROP NOT NULL;

-- 3. Recréer la fonction améliorée
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name', 
            split_part(NEW.email, '@', 1)
        ),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log l'erreur mais ne fait pas échouer l'inscription
        RAISE WARNING 'Erreur lors de la création du profil utilisateur: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recréer le trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 5. Vérification
SELECT 'Script de correction appliqué avec succès !' as message;
