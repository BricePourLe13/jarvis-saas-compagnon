-- ===========================================
-- 🚀 SCRIPT PRODUCTION FIX: Sessions utilisateurs
-- ===========================================
-- À exécuter dans le SQL Editor de Supabase en production
-- pour corriger l'erreur 500 sur /api/admin/sessions

-- Vérifier d'abord si la table existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'user_sessions'
);

-- Si elle n'existe pas, créer la table et toutes les fonctions
-- (copier le contenu complet de create-user-sessions-table.sql ici)

-- ===========================================
-- 🔐 TABLE: user_sessions
-- ===========================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User Info
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  
  -- Session Details
  session_token VARCHAR(255) UNIQUE NOT NULL,
  refresh_token VARCHAR(255),
  
  -- Device & Location
  device_info JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint VARCHAR(255),
  
  -- Geographic
  location_data JSONB DEFAULT '{}'::jsonb,
  
  -- Session Status
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_duration INTEGER DEFAULT 0,
  
  -- Security
  login_method VARCHAR(50) DEFAULT 'password',
  trust_level VARCHAR(20) DEFAULT 'normal' CHECK (trust_level IN ('trusted', 'normal', 'suspicious')),
  failed_actions INTEGER DEFAULT 0,
  
  -- Session Metadata
  session_metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  terminated_at TIMESTAMP WITH TIME ZONE,
  
  -- Termination Info
  termination_reason VARCHAR(100),
  terminated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_activity ON user_sessions(last_activity DESC) WHERE is_active = true;

-- RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_sessions_super_admin_all" ON user_sessions;
CREATE POLICY "user_sessions_super_admin_all"
  ON user_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- Vue sessions actives
CREATE OR REPLACE VIEW active_user_sessions AS
SELECT 
  s.*,
  u.full_name,
  CASE 
    WHEN s.last_activity > NOW() - INTERVAL '5 minutes' THEN 'online'
    WHEN s.last_activity > NOW() - INTERVAL '30 minutes' THEN 'idle'
    WHEN s.last_activity > NOW() - INTERVAL '2 hours' THEN 'away'
    ELSE 'inactive'
  END as status,
  EXTRACT(EPOCH FROM (NOW() - s.created_at))::INTEGER as session_age_seconds,
  EXTRACT(EPOCH FROM (NOW() - s.last_activity))::INTEGER as inactive_seconds
FROM user_sessions s
JOIN users u ON s.user_id = u.id
WHERE s.is_active = true
  AND s.expires_at > NOW()
ORDER BY s.last_activity DESC;

-- Fonctions essentielles
CREATE OR REPLACE FUNCTION cleanup_expired_sessions() RETURNS INTEGER AS $$
DECLARE
  v_cleaned_count INTEGER;
BEGIN
  UPDATE user_sessions 
  SET 
    is_active = false,
    terminated_at = NOW(),
    updated_at = NOW(),
    termination_reason = 'expired'
  WHERE is_active = true 
    AND expires_at <= NOW();
  
  GET DIAGNOSTICS v_cleaned_count = ROW_COUNT;
  RETURN v_cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION terminate_user_session(
  p_session_token VARCHAR(255),
  p_reason VARCHAR(100) DEFAULT 'logout',
  p_terminated_by UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_sessions 
  SET 
    is_active = false,
    terminated_at = NOW(),
    updated_at = NOW(),
    termination_reason = p_reason,
    terminated_by = p_terminated_by
  WHERE session_token = p_session_token;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION terminate_all_user_sessions(
  p_user_id UUID,
  p_reason VARCHAR(100) DEFAULT 'forced',
  p_terminated_by UUID DEFAULT NULL,
  p_exclude_session VARCHAR(255) DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_terminated_count INTEGER;
BEGIN
  UPDATE user_sessions 
  SET 
    is_active = false,
    terminated_at = NOW(),
    updated_at = NOW(),
    termination_reason = p_reason,
    terminated_by = p_terminated_by
  WHERE user_id = p_user_id 
    AND is_active = true
    AND (p_exclude_session IS NULL OR session_token != p_exclude_session);
  
  GET DIAGNOSTICS v_terminated_count = ROW_COUNT;
  RETURN v_terminated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION terminate_user_session TO authenticated;
GRANT EXECUTE ON FUNCTION terminate_all_user_sessions TO authenticated;

-- Test rapide
SELECT 'Sessions setup terminé avec succès!' as message;