-- ===========================================
-- 📊 TABLE: user_activity_logs
-- ===========================================
-- Système complet de tracking des actions utilisateur
-- pour audit, sécurité et analytics

CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Actor (qui a fait l'action)
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL, -- Cache pour perf
  user_role VARCHAR(50) NOT NULL,   -- Cache du rôle au moment de l'action
  
  -- Action Details
  action_type VARCHAR(100) NOT NULL CHECK (action_type IN (
    -- Authentication
    'login', 'logout', 'password_change', 'profile_update',
    
    -- User Management
    'user_created', 'user_updated', 'user_deleted', 'user_invited',
    'permissions_updated', 'role_changed', 'user_deactivated', 'user_reactivated',
    
    -- Team Management
    'invitation_sent', 'invitation_resent', 'invitation_cancelled',
    
    -- Franchise Management
    'franchise_created', 'franchise_updated', 'franchise_deleted',
    'franchise_status_changed',
    
    -- Gym Management
    'gym_created', 'gym_updated', 'gym_deleted', 'gym_status_changed',
    'kiosk_provisioned', 'kiosk_config_updated',
    
    -- Security
    'unauthorized_access_attempt', 'permission_denied',
    'suspicious_activity', 'bulk_operation',
    
    -- System
    'data_export', 'settings_changed', 'api_key_generated'
  )),
  
  -- Target (sur quoi porte l'action)
  target_type VARCHAR(50), -- 'user', 'franchise', 'gym', 'system', etc.
  target_id UUID,          -- ID de l'objet concerné
  target_name VARCHAR(255), -- Nom pour affichage (cache)
  
  -- Context
  description TEXT NOT NULL,        -- Description humaine de l'action
  details JSONB DEFAULT '{}'::jsonb, -- Détails techniques de l'action
  
  -- Changes (pour les updates)
  old_values JSONB DEFAULT '{}'::jsonb, -- Valeurs avant modification
  new_values JSONB DEFAULT '{}'::jsonb, -- Valeurs après modification
  
  -- Technical metadata
  ip_address INET,            -- IP de l'utilisateur
  user_agent TEXT,           -- Browser/client info
  session_id VARCHAR(255),   -- ID de session
  request_id VARCHAR(255),   -- ID de la requête pour traçabilité
  
  -- Risk & Severity
  risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
  
  -- Status
  success BOOLEAN DEFAULT true,
  error_message TEXT,        -- Si échec, détails de l'erreur
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 🔗 INDEXES pour Performance
-- ===========================================

-- Index principal par utilisateur et date
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date 
ON user_activity_logs(user_id, created_at DESC);

-- Index par type d'action
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type 
ON user_activity_logs(action_type);

-- Index par target (pour voir qui a modifié quoi)
CREATE INDEX IF NOT EXISTS idx_activity_logs_target 
ON user_activity_logs(target_type, target_id);

-- Index par date pour purge/archives
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at 
ON user_activity_logs(created_at);

-- Index par niveau de risque (alertes sécurité)
CREATE INDEX IF NOT EXISTS idx_activity_logs_risk_level 
ON user_activity_logs(risk_level) WHERE risk_level IN ('high', 'critical');

-- Index par succès (pour monitoring erreurs)
CREATE INDEX IF NOT EXISTS idx_activity_logs_errors 
ON user_activity_logs(success, created_at) WHERE success = false;

-- Index composite pour analytics
CREATE INDEX IF NOT EXISTS idx_activity_logs_analytics 
ON user_activity_logs(action_type, user_role, created_at);

-- ===========================================
-- 🛡️ RLS POLICIES
-- ===========================================

-- Activer RLS
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Super admins voient tout
CREATE POLICY "activity_logs_super_admin_all"
  ON user_activity_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- Utilisateurs voient leurs propres logs
CREATE POLICY "activity_logs_own_logs"
  ON user_activity_logs FOR SELECT
  USING (user_id = auth.uid());

-- Managers voient les logs de leur scope
CREATE POLICY "activity_logs_managers_scope"
  ON user_activity_logs FOR SELECT
  USING (
    -- Franchise owners voient les logs liés à leurs franchises
    (target_type = 'franchise' AND target_id = ANY(
      SELECT unnest(franchise_access) FROM users WHERE id = auth.uid()
    ))
    OR
    -- Gym managers voient les logs liés à leurs salles
    (target_type = 'gym' AND target_id = ANY(
      SELECT unnest(gym_access) FROM users WHERE id = auth.uid()
    ))
    OR
    -- Voir les logs des utilisateurs de leur scope
    (target_type = 'user' AND target_id IN (
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
    ))
  );

-- ===========================================
-- 📊 VUES UTILES
-- ===========================================

-- Vue pour les dernières activités avec infos user
CREATE OR REPLACE VIEW recent_user_activities AS
SELECT 
  al.*,
  u.full_name,
  CASE 
    WHEN al.created_at > NOW() - INTERVAL '1 hour' THEN 'just_now'
    WHEN al.created_at > NOW() - INTERVAL '1 day' THEN 'today'
    WHEN al.created_at > NOW() - INTERVAL '7 days' THEN 'this_week'
    ELSE 'older'
  END as time_category
FROM user_activity_logs al
JOIN users u ON al.user_id = u.id
WHERE al.created_at > NOW() - INTERVAL '30 days'
ORDER BY al.created_at DESC;

-- Vue pour les statistiques par utilisateur
CREATE OR REPLACE VIEW user_activity_stats AS
SELECT 
  u.id,
  u.full_name,
  u.email,
  u.role,
  COUNT(al.id) as total_actions,
  COUNT(CASE WHEN al.created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as actions_today,
  COUNT(CASE WHEN al.created_at > NOW() - INTERVAL '7 days' THEN 1 END) as actions_this_week,
  COUNT(CASE WHEN al.success = false THEN 1 END) as failed_actions,
  MAX(al.created_at) as last_activity,
  COUNT(CASE WHEN al.risk_level IN ('high', 'critical') THEN 1 END) as high_risk_actions
FROM users u
LEFT JOIN user_activity_logs al ON u.id = al.user_id
GROUP BY u.id, u.full_name, u.email, u.role;

-- ===========================================
-- 🔧 FONCTION HELPER POUR LOGGING
-- ===========================================

-- Fonction pour simplifier l'ajout de logs
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_action_type VARCHAR(100),
  p_description TEXT,
  p_target_type VARCHAR(50) DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_target_name VARCHAR(255) DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_old_values JSONB DEFAULT '{}'::jsonb,
  p_new_values JSONB DEFAULT '{}'::jsonb,
  p_risk_level VARCHAR(20) DEFAULT 'low',
  p_severity VARCHAR(20) DEFAULT 'info',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_user_email VARCHAR(255);
  v_user_role VARCHAR(50);
  v_log_id UUID;
BEGIN
  -- Récupérer les infos utilisateur
  SELECT email, role INTO v_user_email, v_user_role
  FROM users WHERE id = p_user_id;
  
  -- Insérer le log
  INSERT INTO user_activity_logs (
    user_id, user_email, user_role,
    action_type, description,
    target_type, target_id, target_name,
    details, old_values, new_values,
    risk_level, severity,
    ip_address, user_agent
  ) VALUES (
    p_user_id, v_user_email, v_user_role,
    p_action_type, p_description,
    p_target_type, p_target_id, p_target_name,
    p_details, p_old_values, p_new_values,
    p_risk_level, p_severity,
    p_ip_address, p_user_agent
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 📝 EXEMPLE D'UTILISATION
-- ===========================================

/*
-- Exemple 1: Log simple de connexion
SELECT log_user_activity(
  '550e8400-e29b-41d4-a716-446655440000'::UUID,
  'login',
  'Connexion au dashboard admin',
  'system',
  NULL,
  'Dashboard',
  '{"browser": "Chrome", "os": "Windows"}'::jsonb
);

-- Exemple 2: Log de modification utilisateur
SELECT log_user_activity(
  '550e8400-e29b-41d4-a716-446655440000'::UUID,
  'user_updated',
  'Modification profil utilisateur John Doe',
  'user',
  '660e8400-e29b-41d4-a716-446655440001'::UUID,
  'John Doe',
  '{"fields_changed": ["full_name", "role"]}'::jsonb,
  '{"full_name": "John", "role": "gym_staff"}'::jsonb,
  '{"full_name": "John Doe", "role": "gym_manager"}'::jsonb,
  'medium',
  'info'
);
*/

COMMIT;