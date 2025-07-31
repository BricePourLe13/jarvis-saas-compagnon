-- ===========================================
-- 🔐 TABLE: user_sessions
-- ===========================================
-- Suivi des sessions utilisateur actives
-- pour surveillance et déconnexion forcée

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User Info
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  
  -- Session Details
  session_token VARCHAR(255) UNIQUE NOT NULL, -- Token de session Supabase
  refresh_token VARCHAR(255), -- Token de refresh Supabase
  
  -- Device & Location
  device_info JSONB DEFAULT '{}'::jsonb, -- Browser, OS, etc.
  ip_address INET,
  user_agent TEXT,
  device_fingerprint VARCHAR(255), -- Hash unique du device
  
  -- Geographic
  location_data JSONB DEFAULT '{}'::jsonb, -- Pays, ville, timezone
  
  -- Session Status
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_duration INTEGER DEFAULT 0, -- En secondes
  
  -- Security
  login_method VARCHAR(50) DEFAULT 'password', -- password, oauth, sso
  trust_level VARCHAR(20) DEFAULT 'normal' CHECK (trust_level IN ('trusted', 'normal', 'suspicious')),
  failed_actions INTEGER DEFAULT 0, -- Nombre d'actions échouées
  
  -- Session Metadata
  session_metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  terminated_at TIMESTAMP WITH TIME ZONE,
  
  -- Termination Info
  termination_reason VARCHAR(100), -- 'logout', 'forced', 'expired', 'security'
  terminated_by UUID REFERENCES users(id) -- Qui a forcé la déconnexion
);

-- ===========================================
-- 🔗 INDEXES pour Performance
-- ===========================================

-- Index principal par utilisateur
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id 
ON user_sessions(user_id);

-- Index par session token pour auth rapide
CREATE INDEX IF NOT EXISTS idx_user_sessions_token 
ON user_sessions(session_token) WHERE is_active = true;

-- Index par activité récente
CREATE INDEX IF NOT EXISTS idx_user_sessions_activity 
ON user_sessions(last_activity DESC) WHERE is_active = true;

-- Index par expiration
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires 
ON user_sessions(expires_at) WHERE is_active = true;

-- Index par IP pour détection anomalies
CREATE INDEX IF NOT EXISTS idx_user_sessions_ip 
ON user_sessions(ip_address, user_id);

-- Index par device fingerprint
CREATE INDEX IF NOT EXISTS idx_user_sessions_device 
ON user_sessions(device_fingerprint, user_id);

-- Index sessions actives par utilisateur
CREATE INDEX IF NOT EXISTS idx_user_sessions_active_user 
ON user_sessions(user_id, is_active, last_activity) WHERE is_active = true;

-- ===========================================
-- 🛡️ RLS POLICIES
-- ===========================================

-- Activer RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Super admins voient toutes les sessions
CREATE POLICY "user_sessions_super_admin_all"
  ON user_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- Utilisateurs voient leurs propres sessions
CREATE POLICY "user_sessions_own_sessions"
  ON user_sessions FOR SELECT
  USING (user_id = auth.uid());

-- Managers voient les sessions de leur scope
CREATE POLICY "user_sessions_managers_scope"
  ON user_sessions FOR SELECT
  USING (
    user_id IN (
      SELECT u.id FROM users u
      WHERE (
        -- Users avec accès aux mêmes franchises
        u.franchise_access && (
          SELECT franchise_access FROM users WHERE id = auth.uid()
        )
        OR
        -- Users avec accès aux mêmes salles
        u.gym_access && (
          SELECT gym_access FROM users WHERE id = auth.uid()
        )
      )
    )
  );

-- ===========================================
-- 📊 VUES UTILES
-- ===========================================

-- Vue sessions actives avec infos utilisateur
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

-- Vue statistiques sessions par utilisateur
CREATE OR REPLACE VIEW user_session_stats AS
SELECT 
  u.id,
  u.full_name,
  u.email,
  u.role,
  COUNT(s.id) as total_sessions,
  COUNT(CASE WHEN s.is_active = true THEN 1 END) as active_sessions,
  MAX(s.last_activity) as last_seen,
  COUNT(CASE WHEN s.created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as sessions_today,
  COUNT(CASE WHEN s.termination_reason = 'forced' THEN 1 END) as forced_logouts,
  ARRAY_AGG(DISTINCT s.ip_address ORDER BY s.ip_address) FILTER (WHERE s.ip_address IS NOT NULL) as used_ips
FROM users u
LEFT JOIN user_sessions s ON u.id = s.user_id
GROUP BY u.id, u.full_name, u.email, u.role;

-- ===========================================
-- 🔧 FONCTIONS UTILES
-- ===========================================

-- Fonction pour créer une nouvelle session
CREATE OR REPLACE FUNCTION create_user_session(
  p_user_id UUID,
  p_session_token VARCHAR(255),
  p_refresh_token VARCHAR(255) DEFAULT NULL,
  p_device_info JSONB DEFAULT '{}'::jsonb,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_device_fingerprint VARCHAR(255) DEFAULT NULL,
  p_location_data JSONB DEFAULT '{}'::jsonb,
  p_login_method VARCHAR(50) DEFAULT 'password'
) RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_user_email VARCHAR(255);
  v_user_role VARCHAR(50);
BEGIN
  -- Récupérer infos utilisateur
  SELECT email, role INTO v_user_email, v_user_role
  FROM users WHERE id = p_user_id;
  
  -- Créer la session
  INSERT INTO user_sessions (
    user_id, user_email, user_role,
    session_token, refresh_token,
    device_info, ip_address, user_agent,
    device_fingerprint, location_data,
    login_method
  ) VALUES (
    p_user_id, v_user_email, v_user_role,
    p_session_token, p_refresh_token,
    p_device_info, p_ip_address, p_user_agent,
    p_device_fingerprint, p_location_data,
    p_login_method
  ) RETURNING id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour l'activité d'une session
CREATE OR REPLACE FUNCTION update_session_activity(
  p_session_token VARCHAR(255)
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_sessions 
  SET 
    last_activity = NOW(),
    updated_at = NOW(),
    session_duration = EXTRACT(EPOCH FROM (NOW() - created_at))::INTEGER
  WHERE session_token = p_session_token 
    AND is_active = true 
    AND expires_at > NOW();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour terminer une session
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

-- Fonction pour terminer toutes les sessions d'un utilisateur
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

-- Fonction de nettoyage des sessions expirées
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

-- ===========================================
-- 🔐 PERMISSIONS
-- ===========================================

-- Donner accès aux fonctions
GRANT EXECUTE ON FUNCTION create_user_session TO authenticated;
GRANT EXECUTE ON FUNCTION update_session_activity TO authenticated;
GRANT EXECUTE ON FUNCTION terminate_user_session TO authenticated;
GRANT EXECUTE ON FUNCTION terminate_all_user_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions TO authenticated;

-- ===========================================
-- ⏰ TRIGGER AUTO-CLEANUP
-- ===========================================

-- Trigger pour nettoyer automatiquement les sessions expirées
CREATE OR REPLACE FUNCTION trigger_cleanup_sessions() RETURNS TRIGGER AS $$
BEGIN
  -- Nettoyer les sessions expirées à chaque nouvelle session
  PERFORM cleanup_expired_sessions();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_cleanup_sessions
  AFTER INSERT ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cleanup_sessions();

COMMIT;