-- ===========================================
-- 🚨 DEBUG: Bug invitation mélange comptes  
-- ===========================================

-- 1. Voir TOUS les utilisateurs avec ces emails
SELECT 
    '👥 UTILISATEURS CONCERNÉS' as section,
    id,
    email,
    full_name,
    role,
    is_active,
    invitation_status,
    created_at,
    updated_at
FROM users 
WHERE email IN ('brice@jarvis-group.net', 'brice.pradet@gmail.com')
ORDER BY email, created_at;

-- 2. Chercher des doublons d'UUID
SELECT 
    '🔍 DOUBLONS UUID' as section,
    id,
    count(*) as count_emails,
    string_agg(email, ', ') as emails
FROM users 
WHERE email IN ('brice@jarvis-group.net', 'brice.pradet@gmail.com')
GROUP BY id
HAVING count(*) > 1;

-- 3. Voir TOUS les utilisateurs (pour contexte)
SELECT 
    '📊 TOUS LES USERS' as section,
    count(*) as total_users,
    count(*) FILTER (WHERE email LIKE '%brice%') as brice_accounts
FROM users;

-- 4. Détails de tous les comptes Brice
SELECT 
    '👤 TOUS COMPTES BRICE' as section,
    id,
    email,
    full_name,
    role,
    is_active,
    invitation_status,
    created_at
FROM users 
WHERE email LIKE '%brice%' OR full_name LIKE '%Brice%'
ORDER BY created_at;