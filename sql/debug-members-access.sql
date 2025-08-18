-- 🔍 DEBUG: Pourquoi les membres ne s'affichent pas dans le dashboard manager ?

-- 1. Vérifier la structure des gyms
SELECT 
  '🏠 GYMS EXISTANTES' as check_type,
  id,
  name,
  manager_id,
  status,
  slug
FROM gyms 
ORDER BY created_at DESC
LIMIT 5;

-- 2. Vérifier les membres de gym
SELECT 
  '👥 MEMBRES EXISTANTS' as check_type,
  COUNT(*) as total_membres,
  gym_id,
  g.name as gym_name
FROM gym_members gm
LEFT JOIN gyms g ON gm.gym_id = g.id
WHERE gm.is_active = true
GROUP BY gym_id, g.name
ORDER BY total_membres DESC;

-- 3. Vérifier les utilisateurs avec role manager
SELECT 
  '👨‍💼 MANAGERS' as check_type,
  id,
  email,
  role,
  created_at
FROM users 
WHERE role = 'manager'
ORDER BY created_at DESC;

-- 4. Vérifier les conversations récentes
SELECT 
  '💬 CONVERSATIONS RÉCENTES' as check_type,
  COUNT(*) as total_conversations,
  member_id,
  gym_id,
  MAX(timestamp) as derniere_conversation
FROM jarvis_conversation_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY member_id, gym_id
ORDER BY derniere_conversation DESC
LIMIT 10;
