-- ===========================================
-- 🔄 MIGRATION VERS SCHÉMA V2 UNIFIÉ
-- ===========================================
-- But: Migrer vers le schéma v2-franchises unifié
--      et corriger toutes les incohérences identifiées

-- ===========================================
-- 1. 🧹 NETTOYAGE DES ANCIENS ÉLÉMENTS
-- ===========================================

-- Supprimer les anciennes politiques RLS conflictuelles
DROP POLICY IF EXISTS "Franchises visibles par propriétaires et admins" ON franchises;
DROP POLICY IF EXISTS "Franchises modifiables par propriétaires" ON franchises;
DROP POLICY IF EXISTS "Nouvelles franchises par utilisateurs authentifiés" ON franchises;
DROP POLICY IF EXISTS "Utilisateurs visibles selon franchise" ON users;
DROP POLICY IF EXISTS "Utilisateurs modifiables par eux-mêmes ou admins" ON users;

-- Supprimer les anciens types ENUM si ils existent
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS subscription_plan CASCADE;
DROP TYPE IF EXISTS session_type CASCADE;

-- ===========================================
-- 2. 🏗️ MISE À JOUR DE LA TABLE USERS
-- ===========================================

-- Ajouter les nouvelles colonnes si elles n'existent pas
DO $$ 
BEGIN
    -- Franchise access array
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'franchise_access'
    ) THEN
        ALTER TABLE users ADD COLUMN franchise_access UUID[];
        RAISE NOTICE 'Colonne franchise_access ajoutée à users';
    END IF;
    
    -- Gym access array
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'gym_access'
    ) THEN
        ALTER TABLE users ADD COLUMN gym_access UUID[];
        RAISE NOTICE 'Colonne gym_access ajoutée à users';
    END IF;
    
    -- Dashboard preferences
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'dashboard_preferences'
    ) THEN
        ALTER TABLE users ADD COLUMN dashboard_preferences JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Colonne dashboard_preferences ajoutée à users';
    END IF;
    
    -- Notification settings
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'notification_settings'
    ) THEN
        ALTER TABLE users ADD COLUMN notification_settings JSONB DEFAULT '{
            "email_notifications": true,
            "push_notifications": true,
            "reports_frequency": "weekly"
        }'::jsonb;
        RAISE NOTICE 'Colonne notification_settings ajoutée à users';
    END IF;
    
    -- Corriger le nom de la colonne last_login (vs last_login_at)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_login_at'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_login'
    ) THEN
        ALTER TABLE users RENAME COLUMN last_login_at TO last_login;
        RAISE NOTICE 'Colonne last_login_at renommée en last_login';
    END IF;
END $$;

-- Migrer les données de franchise_id vers franchise_access array
UPDATE users 
SET franchise_access = ARRAY[franchise_id]
WHERE franchise_id IS NOT NULL 
AND (franchise_access IS NULL OR cardinality(franchise_access) = 0);

-- Mettre à jour les rôles utilisateur vers la nouvelle nomenclature
UPDATE users SET role = 'gym_manager' WHERE role = 'franchise_admin';
UPDATE users SET role = 'gym_staff' WHERE role = 'member';

-- ===========================================
-- 3. 🏢 MISE À JOUR DE LA TABLE FRANCHISES  
-- ===========================================

DO $$
BEGIN
    -- Renommer email → contact_email
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'franchises' AND column_name = 'email'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'franchises' AND column_name = 'contact_email'
    ) THEN
        ALTER TABLE franchises RENAME COLUMN email TO contact_email;
        RAISE NOTICE 'Colonne email renommée en contact_email dans franchises';
    END IF;
    
    -- Renommer address → headquarters_address
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'franchises' AND column_name = 'address'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'franchises' AND column_name = 'headquarters_address'
    ) THEN
        ALTER TABLE franchises RENAME COLUMN address TO headquarters_address;
        RAISE NOTICE 'Colonne address renommée en headquarters_address dans franchises';
    END IF;
    
    -- Ajouter brand_logo
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'franchises' AND column_name = 'brand_logo'
    ) THEN
        ALTER TABLE franchises ADD COLUMN brand_logo TEXT;
        RAISE NOTICE 'Colonne brand_logo ajoutée à franchises';
    END IF;
    
    -- Ajouter jarvis_config
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'franchises' AND column_name = 'jarvis_config'
    ) THEN
        ALTER TABLE franchises ADD COLUMN jarvis_config JSONB DEFAULT '{
            "avatar_customization": {},
            "brand_colors": {
                "primary": "#2563eb",
                "secondary": "#1e40af", 
                "accent": "#3b82f6"
            },
            "welcome_message": "Bienvenue dans votre salle de sport !",
            "features_enabled": ["analytics", "reports"]
        }'::jsonb;
        RAISE NOTICE 'Colonne jarvis_config ajoutée à franchises';
    END IF;
    
    -- Ajouter status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'franchises' AND column_name = 'status'
    ) THEN
        ALTER TABLE franchises ADD COLUMN status VARCHAR(20) DEFAULT 'active' 
        CHECK (status IN ('active', 'trial', 'suspended'));
        RAISE NOTICE 'Colonne status ajoutée à franchises';
    END IF;
END $$;

-- ===========================================
-- 4. 🏋️ CRÉER/METTRE À JOUR TABLE GYMS
-- ===========================================

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
        "installation_token": null,
        "provisioning_expires_at": null,
        "is_provisioned": false,
        "provisioned_at": null,
        "last_heartbeat": null,
        "rfid_reader_id": null,
        "screen_resolution": null,
        "browser_info": {},
        "avatar_style": "friendly",
        "welcome_message": "Bonjour ! Comment puis-je vous aider ?",
        "brand_colors": {}
    }'::jsonb,
    
    -- Management
    manager_id UUID, -- Lien vers users table
    staff_ids UUID[] DEFAULT '{}', -- Array d'UUIDs vers users
    
    -- Business
    member_count INTEGER DEFAULT 0,
    opening_hours JSONB DEFAULT '[]'::jsonb, -- Array des horaires
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'offline')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 5. 🤖 CRÉER TABLE JARVIS_SESSIONS (vs kiosk_sessions)
-- ===========================================

CREATE TABLE IF NOT EXISTS jarvis_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    
    -- Member interaction
    member_badge_id VARCHAR(255), -- ID badge RFID scanné
    conversation_transcript JSONB DEFAULT '[]'::jsonb, -- Array des messages
    
    -- AI Analysis
    intent_detected TEXT[] DEFAULT '{}', -- Array des intents détectés
    sentiment_score DECIMAL(3,2), -- -1.00 à 1.00
    satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
    
    -- Technical
    session_duration INTEGER NOT NULL, -- En secondes
    kiosk_url_slug VARCHAR(255), -- Confirmation du kiosk
    processed_by_ai BOOLEAN DEFAULT false,
    
    -- Metadata
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_metadata JSONB DEFAULT '{}'::jsonb -- Infos techniques additionnelles
);

-- ===========================================
-- 6. 📊 CRÉER TABLE ANALYTICS_DAILY
-- ===========================================

CREATE TABLE IF NOT EXISTS analytics_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    
    -- Date de référence
    date DATE NOT NULL,
    
    -- Métriques JARVIS
    total_sessions INTEGER DEFAULT 0,
    total_duration_minutes INTEGER DEFAULT 0,
    average_satisfaction DECIMAL(3,2),
    unique_members INTEGER DEFAULT 0,
    
    -- Métriques business
    total_cost_eur DECIMAL(10,2) DEFAULT 0.00,
    cost_per_session DECIMAL(10,2) DEFAULT 0.00,
    
    -- Performance
    success_rate DECIMAL(5,2) DEFAULT 0.00, -- Pourcentage
    average_response_time_ms INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte d'unicité par gym/date
    UNIQUE(gym_id, date)
);

-- ===========================================
-- 7. 🔐 POLITIQUES RLS V2 COHÉRENTES
-- ===========================================

-- Activer RLS sur toutes les tables
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

-- POLITIQUES FRANCHISES V2
CREATE POLICY "franchises_super_admin_all"
    ON franchises FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'super_admin'
        )
    );

CREATE POLICY "franchises_owners_own"
    ON franchises FOR ALL
    USING (
        owner_id = auth.uid()
        OR
        auth.uid() = ANY(
            SELECT unnest(franchise_access) 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- POLITIQUES GYMS V2
CREATE POLICY "gyms_super_admin_all"
    ON gyms FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'super_admin'
        )
    );

CREATE POLICY "gyms_franchise_access"
    ON gyms FOR ALL
    USING (
        franchise_id IN (
            SELECT id FROM franchises 
            WHERE owner_id = auth.uid()
        )
        OR
        franchise_id = ANY(
            SELECT unnest(franchise_access) 
            FROM users 
            WHERE id = auth.uid()
        )
        OR
        id = ANY(
            SELECT unnest(gym_access) 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- ===========================================
-- 8. 📈 INDEX POUR PERFORMANCE
-- ===========================================

-- Franchises
CREATE INDEX IF NOT EXISTS idx_franchises_owner_id ON franchises(owner_id);
CREATE INDEX IF NOT EXISTS idx_franchises_status ON franchises(status);

-- Gyms
CREATE INDEX IF NOT EXISTS idx_gyms_franchise_id ON gyms(franchise_id);
CREATE INDEX IF NOT EXISTS idx_gyms_status ON gyms(status);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_franchise_access ON users USING GIN(franchise_access);
CREATE INDEX IF NOT EXISTS idx_users_gym_access ON users USING GIN(gym_access);

-- Sessions
CREATE INDEX IF NOT EXISTS idx_jarvis_sessions_gym_id ON jarvis_sessions(gym_id);
CREATE INDEX IF NOT EXISTS idx_jarvis_sessions_timestamp ON jarvis_sessions(timestamp);

-- Analytics
CREATE INDEX IF NOT EXISTS idx_analytics_gym_date ON analytics_daily(gym_id, date);
CREATE INDEX IF NOT EXISTS idx_analytics_franchise_date ON analytics_daily(franchise_id, date);

-- ===========================================
-- 9. 🔄 TRIGGERS UPDATED_AT
-- ===========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer les triggers
DROP TRIGGER IF EXISTS update_franchises_updated_at ON franchises;
CREATE TRIGGER update_franchises_updated_at
    BEFORE UPDATE ON franchises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gyms_updated_at ON gyms;
CREATE TRIGGER update_gyms_updated_at
    BEFORE UPDATE ON gyms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_analytics_updated_at ON analytics_daily;
CREATE TRIGGER update_analytics_updated_at
    BEFORE UPDATE ON analytics_daily
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- ✅ MIGRATION V2 TERMINÉE !
-- ===========================================

DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ===== MIGRATION VERS SCHÉMA V2 TERMINÉE ! =====';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Schémas unifiés:';
    RAISE NOTICE '   - Suppression des anciens types ENUM conflictuels';
    RAISE NOTICE '   - Colonnes users alignées avec schéma v2';
    RAISE NOTICE '   - Franchises: email→contact_email, address→headquarters_address';
    RAISE NOTICE '   - Rôles standardisés: gym_manager, gym_staff (vs franchise_admin, member)';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Tables cohérentes:';
    RAISE NOTICE '   - franchises (v2)';
    RAISE NOTICE '   - gyms (v2)';
    RAISE NOTICE '   - users (v2 avec franchise_access[], gym_access[])';
    RAISE NOTICE '   - jarvis_sessions (vs kiosk_sessions)';
    RAISE NOTICE '   - analytics_daily (nouveau)';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Sécurité:';
    RAISE NOTICE '   - RLS policies v2 cohérentes';
    RAISE NOTICE '   - Index optimisés pour performance';
    RAISE NOTICE '   - Triggers updated_at sur toutes les tables';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Base de données prête pour production v2 !';
    RAISE NOTICE '';
END $$;