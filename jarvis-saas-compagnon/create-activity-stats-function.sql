-- ===========================================
-- 📊 FONCTION: get_activity_stats
-- ===========================================
-- Récupère les statistiques d'activité pour le dashboard

CREATE OR REPLACE FUNCTION get_activity_stats(days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
  total_logs_count INTEGER;
  today_logs_count INTEGER;
  failed_logs_count INTEGER;
  high_risk_logs_count INTEGER;
  top_actions_data JSON;
  top_users_data JSON;
BEGIN
  -- Compter total des logs
  SELECT COUNT(*) INTO total_logs_count
  FROM user_activity_logs
  WHERE created_at > NOW() - INTERVAL '1 day' * days_back;
  
  -- Compter logs d'aujourd'hui
  SELECT COUNT(*) INTO today_logs_count
  FROM user_activity_logs
  WHERE created_at > CURRENT_DATE;
  
  -- Compter logs échoués
  SELECT COUNT(*) INTO failed_logs_count
  FROM user_activity_logs
  WHERE created_at > NOW() - INTERVAL '1 day' * days_back
  AND success = false;
  
  -- Compter logs à risque élevé
  SELECT COUNT(*) INTO high_risk_logs_count
  FROM user_activity_logs
  WHERE created_at > NOW() - INTERVAL '1 day' * days_back
  AND risk_level IN ('high', 'critical');
  
  -- Top actions
  SELECT JSON_AGG(
    JSON_BUILD_OBJECT(
      'action_type', action_type,
      'count', action_count
    )
    ORDER BY action_count DESC
  ) INTO top_actions_data
  FROM (
    SELECT action_type, COUNT(*) as action_count
    FROM user_activity_logs
    WHERE created_at > NOW() - INTERVAL '1 day' * days_back
    GROUP BY action_type
    ORDER BY action_count DESC
    LIMIT 10
  ) t;
  
  -- Top utilisateurs
  SELECT JSON_AGG(
    JSON_BUILD_OBJECT(
      'user_id', user_id,
      'full_name', full_name,
      'count', user_count
    )
    ORDER BY user_count DESC
  ) INTO top_users_data
  FROM (
    SELECT 
      al.user_id,
      u.full_name,
      COUNT(*) as user_count
    FROM user_activity_logs al
    JOIN users u ON al.user_id = u.id
    WHERE al.created_at > NOW() - INTERVAL '1 day' * days_back
    GROUP BY al.user_id, u.full_name
    ORDER BY user_count DESC
    LIMIT 10
  ) t;
  
  -- Construire le résultat
  result := JSON_BUILD_OBJECT(
    'total_logs', COALESCE(total_logs_count, 0),
    'today_logs', COALESCE(today_logs_count, 0),
    'failed_logs', COALESCE(failed_logs_count, 0),
    'high_risk_logs', COALESCE(high_risk_logs_count, 0),
    'top_actions', COALESCE(top_actions_data, '[]'::JSON),
    'top_users', COALESCE(top_users_data, '[]'::JSON)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 🔐 PERMISSIONS
-- ===========================================

-- Donner accès aux super admins
REVOKE ALL ON FUNCTION get_activity_stats FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_activity_stats TO authenticated;

COMMIT;