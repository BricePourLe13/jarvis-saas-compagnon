-- ===========================================
-- 🏗️ JARVIS SaaS Compagnon - Schéma Supabase
-- ===========================================

-- 1. Activation des extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Types énumérés
CREATE TYPE user_role AS ENUM ('super_admin', 'franchise_owner', 'franchise_admin', 'member');
CREATE TYPE subscription_plan AS ENUM ('starter', 'professional', 'enterprise');
CREATE TYPE session_type AS ENUM ('information', 'reservation', 'support', 'training');

-- 3. Table des franchises (salles de sport)
CREATE TABLE franchises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    country VARCHAR(100) DEFAULT 'France',
    timezone VARCHAR(50) DEFAULT 'Europe/Paris',
    opening_hours JSONB DEFAULT '{
        "monday": {"open": "06:00", "close": "22:00"},
        "tuesday": {"open": "06:00", "close": "22:00"},
        "wednesday": {"open": "06:00", "close": "22:00"},
        "thursday": {"open": "06:00", "close": "22:00"},
        "friday": {"open": "06:00", "close": "22:00"},
        "saturday": {"open": "08:00", "close": "20:00"},
        "sunday": {"open": "08:00", "close": "20:00"}
    }',
    features TEXT[] DEFAULT ARRAY['cardio', 'musculation', 'cours-collectifs'],
    subscription_plan subscription_plan DEFAULT 'starter',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    owner_id UUID NOT NULL,
    
    CONSTRAINT franchises_email_unique UNIQUE (email),
    CONSTRAINT franchises_name_unique UNIQUE (name)
);

-- 4. Table des utilisateurs (extension de auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role user_role DEFAULT 'member',
    franchise_id UUID REFERENCES franchises(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT users_email_unique UNIQUE (email)
);

-- 5. Table des sessions kiosk IA
CREATE TABLE kiosk_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_type session_type NOT NULL,
    conversation_data JSONB DEFAULT '{}',
    duration_seconds INTEGER DEFAULT 0,
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    
    CONSTRAINT kiosk_sessions_duration_positive CHECK (duration_seconds >= 0)
);

-- 6. Fonction de mise à jour automatique du timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Triggers pour updated_at
CREATE TRIGGER update_franchises_updated_at
    BEFORE UPDATE ON franchises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Row Level Security (RLS)
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiosk_sessions ENABLE ROW LEVEL SECURITY;

-- 9. Politiques RLS pour franchises
CREATE POLICY "Franchises visibles par propriétaires et admins"
    ON franchises FOR SELECT
    USING (
        auth.uid() = owner_id OR
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('super_admin', 'franchise_admin')
        )
    );

CREATE POLICY "Franchises modifiables par propriétaires"
    ON franchises FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Nouvelles franchises par utilisateurs authentifiés"
    ON franchises FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- 10. Politiques RLS pour users
CREATE POLICY "Utilisateurs visibles selon franchise"
    ON users FOR SELECT
    USING (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND (u.role = 'super_admin' OR u.franchise_id = users.franchise_id)
        )
    );

CREATE POLICY "Utilisateurs modifiables par eux-mêmes ou admins"
    ON users FOR UPDATE
    USING (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('super_admin', 'franchise_admin')
        )
    );

-- 11. Politiques RLS pour kiosk_sessions
CREATE POLICY "Sessions kiosk visibles selon franchise"
    ON kiosk_sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            JOIN franchises f ON u.franchise_id = f.id
            WHERE u.id = auth.uid() 
            AND f.id = kiosk_sessions.franchise_id
        ) OR
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'super_admin'
        )
    );

CREATE POLICY "Nouvelles sessions kiosk par franchise"
    ON kiosk_sessions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u 
            JOIN franchises f ON u.franchise_id = f.id
            WHERE u.id = auth.uid() 
            AND f.id = kiosk_sessions.franchise_id
        )
    );

-- 12. Fonction pour créer un utilisateur après inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Trigger pour création automatique d'utilisateur
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 14. Index pour optimiser les performances
CREATE INDEX idx_franchises_owner_id ON franchises(owner_id);
CREATE INDEX idx_franchises_active ON franchises(is_active);
CREATE INDEX idx_users_franchise_id ON users(franchise_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_kiosk_sessions_franchise_id ON kiosk_sessions(franchise_id);
CREATE INDEX idx_kiosk_sessions_created_at ON kiosk_sessions(created_at);
CREATE INDEX idx_kiosk_sessions_user_id ON kiosk_sessions(user_id);

-- 15. Données de test (optionnel)
INSERT INTO franchises (name, address, phone, email, city, postal_code, owner_id) VALUES 
('FitGym Paris Centre', '123 Rue de Rivoli', '01.23.45.67.89', 'paris@fitgym.fr', 'Paris', '75001', auth.uid()),
('PowerGym Lyon', '456 Cours Lafayette', '04.78.90.12.34', 'lyon@powergym.fr', 'Lyon', '69003', auth.uid());

-- 16. Commentaires pour documentation
COMMENT ON TABLE franchises IS 'Table des franchises/salles de sport';
COMMENT ON TABLE users IS 'Table des utilisateurs étendant auth.users';
COMMENT ON TABLE kiosk_sessions IS 'Table des sessions d''interaction avec le kiosk IA';

COMMENT ON COLUMN franchises.opening_hours IS 'Horaires d''ouverture au format JSON';
COMMENT ON COLUMN franchises.features IS 'Liste des équipements disponibles';
COMMENT ON COLUMN kiosk_sessions.conversation_data IS 'Données de conversation avec l''IA au format JSON';
COMMENT ON COLUMN kiosk_sessions.satisfaction_rating IS 'Note de satisfaction de 1 à 5';

-- 17. Vue pour statistiques des franchises
CREATE VIEW franchise_stats AS
SELECT 
    f.id,
    f.name,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT ks.id) as total_sessions,
    AVG(ks.satisfaction_rating) as avg_satisfaction,
    AVG(ks.duration_seconds) as avg_session_duration
FROM franchises f
LEFT JOIN users u ON f.id = u.franchise_id
LEFT JOIN kiosk_sessions ks ON f.id = ks.franchise_id
GROUP BY f.id, f.name;

COMMENT ON VIEW franchise_stats IS 'Vue avec statistiques agrégées par franchise';
