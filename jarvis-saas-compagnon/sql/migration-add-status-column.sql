-- ===========================================
-- 🔄 MIGRATION: Ajouter colonnes manquantes
-- ===========================================
-- But: Ajouter les colonnes 'status' et autres 
--      pour compatibility avec le nouveau code

-- 1. AJOUTER COLONNE STATUS à la table franchises
DO $$ 
BEGIN
    -- Vérifier si la colonne existe déjà
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'franchises' 
        AND column_name = 'status'
    ) THEN
        -- Ajouter la colonne status
        ALTER TABLE franchises 
        ADD COLUMN status VARCHAR(20) DEFAULT 'active' 
        CHECK (status IN ('active', 'trial', 'suspended'));
        
        RAISE NOTICE 'Colonne status ajoutée à la table franchises';
    ELSE
        RAISE NOTICE 'Colonne status existe déjà dans franchises';
    END IF;
END $$;

-- 2. AJOUTER COLONNE JARVIS_CONFIG à la table franchises
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'franchises' 
        AND column_name = 'jarvis_config'
    ) THEN
        -- Ajouter la colonne jarvis_config
        ALTER TABLE franchises 
        ADD COLUMN jarvis_config JSONB DEFAULT '{
            "avatar_customization": {},
            "brand_colors": {
                "primary": "#2563eb",
                "secondary": "#1e40af", 
                "accent": "#3b82f6"
            },
            "welcome_message": "Bienvenue dans votre salle de sport !",
            "features_enabled": ["analytics", "reports"]
        }'::jsonb;
        
        RAISE NOTICE 'Colonne jarvis_config ajoutée à la table franchises';
    ELSE
        RAISE NOTICE 'Colonne jarvis_config existe déjà dans franchises';
    END IF;
END $$;

-- 3. RENOMMER LA COLONNE EMAIL -> CONTACT_EMAIL
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'franchises' 
        AND column_name = 'email'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'franchises' 
        AND column_name = 'contact_email'
    ) THEN
        -- Renommer email en contact_email
        ALTER TABLE franchises RENAME COLUMN email TO contact_email;
        
        RAISE NOTICE 'Colonne email renommée en contact_email dans franchises';
    ELSE
        RAISE NOTICE 'Colonne contact_email existe déjà ou email introuvable';
    END IF;
END $$;

-- 4. RENOMMER LA COLONNE ADDRESS -> HEADQUARTERS_ADDRESS  
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'franchises' 
        AND column_name = 'address'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'franchises' 
        AND column_name = 'headquarters_address'
    ) THEN
        -- Renommer address en headquarters_address
        ALTER TABLE franchises RENAME COLUMN address TO headquarters_address;
        
        RAISE NOTICE 'Colonne address renommée en headquarters_address dans franchises';
    ELSE
        RAISE NOTICE 'Colonne headquarters_address existe déjà ou address introuvable';
    END IF;
END $$;

-- 5. MODIFIER OWNER_ID POUR PERMETTRE NULL (propriétaire optionnel)
DO $$ 
BEGIN
    -- Supprimer la contrainte NOT NULL sur owner_id si elle existe
    ALTER TABLE franchises ALTER COLUMN owner_id DROP NOT NULL;
    
    RAISE NOTICE 'Contrainte NOT NULL supprimée de owner_id dans franchises';
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Erreur lors de la modification de owner_id: %', SQLERRM;
END $$;

-- 6. METTRE À JOUR LES VALEURS PAR DÉFAUT POUR LES FRANCHISES EXISTANTES
UPDATE franchises 
SET status = 'active' 
WHERE status IS NULL;

-- 7. AJOUTER LA COLONNE BRAND_LOGO OPTIONNELLE
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'franchises' 
        AND column_name = 'brand_logo'
    ) THEN
        ALTER TABLE franchises ADD COLUMN brand_logo TEXT;
        RAISE NOTICE 'Colonne brand_logo ajoutée à la table franchises';
    ELSE
        RAISE NOTICE 'Colonne brand_logo existe déjà dans franchises';
    END IF;
END $$;

-- 8. CRÉER TABLE GYMS SI ELLE N'EXISTE PAS
CREATE TABLE IF NOT EXISTS gyms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
    
    -- Basic Information
    name VARCHAR(255) NOT NULL,
    
    -- Location
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    
    -- JARVIS Equipment & Kiosk Linking
    kiosk_config JSONB DEFAULT '{
        "provisioning_code": null,
        "kiosk_url_slug": null,
        "rfid_reader_id": null,
        "hardware_version": "1.0",
        "last_sync": null
    }'::jsonb,
    
    -- Business
    opening_hours JSONB DEFAULT '{
        "monday": {"open": "06:00", "close": "22:00"},
        "tuesday": {"open": "06:00", "close": "22:00"},
        "wednesday": {"open": "06:00", "close": "22:00"},
        "thursday": {"open": "06:00", "close": "22:00"},
        "friday": {"open": "06:00", "close": "22:00"},
        "saturday": {"open": "08:00", "close": "20:00"},
        "sunday": {"open": "08:00", "close": "20:00"}
    }'::jsonb,
    
    features TEXT[] DEFAULT ARRAY['cardio', 'musculation', 'cours-collectifs'],
    
    -- Admin & Status
    manager_id UUID, -- Lien vers users table
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'suspended')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. AJOUTER LES COLONNES FRANCHISE_ACCESS ET GYM_ACCESS À USERS
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'franchise_access'
    ) THEN
        ALTER TABLE users ADD COLUMN franchise_access UUID[];
        RAISE NOTICE 'Colonne franchise_access ajoutée à la table users';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'gym_access'
    ) THEN
        ALTER TABLE users ADD COLUMN gym_access UUID[];
        RAISE NOTICE 'Colonne gym_access ajoutée à la table users';
    END IF;
END $$;

-- 10. AFFICHER LE RÉSUMÉ
DO $$ 
BEGIN
    RAISE NOTICE '✅ Migration terminée !';
    RAISE NOTICE '   - Colonne status ajoutée à franchises';
    RAISE NOTICE '   - Colonne jarvis_config ajoutée à franchises';
    RAISE NOTICE '   - email renommé en contact_email';
    RAISE NOTICE '   - address renommé en headquarters_address';
    RAISE NOTICE '   - owner_id rendu optionnel';
    RAISE NOTICE '   - Table gyms créée';
    RAISE NOTICE '   - Colonnes *_access ajoutées à users';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Tu peux maintenant tester le workflow franchises !';
END $$; 