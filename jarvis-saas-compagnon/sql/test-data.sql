-- ===========================================
-- 📊 JARVIS SaaS - Données de test
-- ===========================================

-- ⚠️ ATTENTION : Exécutez ce script APRÈS vous être connecté à votre application
-- car il utilise auth.uid() pour créer les franchises avec le bon propriétaire

-- 1. Vérifier que l'utilisateur est connecté
SELECT 
    CASE 
        WHEN auth.uid() IS NULL THEN 'ERREUR: Vous devez être connecté pour exécuter ce script'
        ELSE 'OK: Utilisateur connecté avec ID = ' || auth.uid()::text
    END as status;

-- 2. Créer des franchises de test (seulement si utilisateur connecté)
INSERT INTO franchises (name, address, phone, email, city, postal_code, owner_id) 
SELECT 
    'FitGym Paris Centre',
    '123 Rue de Rivoli',
    '01.23.45.67.89',
    'paris@fitgym.fr',
    'Paris',
    '75001',
    auth.uid()
WHERE auth.uid() IS NOT NULL;

INSERT INTO franchises (name, address, phone, email, city, postal_code, owner_id) 
SELECT 
    'PowerGym Lyon',
    '456 Cours Lafayette', 
    '04.78.90.12.34',
    'lyon@powergym.fr',
    'Lyon',
    '69003',
    auth.uid()
WHERE auth.uid() IS NOT NULL;

-- 3. Créer des sessions de test
INSERT INTO kiosk_sessions (franchise_id, session_type, conversation_data, duration_seconds, satisfaction_rating)
SELECT 
    f.id,
    'information',
    '{"messages": [{"role": "user", "content": "Quels sont vos horaires ?"}, {"role": "assistant", "content": "Nous sommes ouverts du lundi au vendredi de 6h à 22h, et le week-end de 8h à 20h."}]}',
    120,
    5
FROM franchises f 
WHERE f.owner_id = auth.uid()
LIMIT 1;

INSERT INTO kiosk_sessions (franchise_id, session_type, conversation_data, duration_seconds, satisfaction_rating)
SELECT 
    f.id,
    'reservation',
    '{"messages": [{"role": "user", "content": "Je voudrais réserver un cours de yoga"}, {"role": "assistant", "content": "Parfait ! Nous avons des créneaux disponibles mardi et jeudi à 18h30."}]}',
    180,
    4
FROM franchises f 
WHERE f.owner_id = auth.uid()
LIMIT 1;

-- 4. Afficher le résultat
SELECT 
    'Données de test créées avec succès !' as message,
    COUNT(*) as franchises_created
FROM franchises 
WHERE owner_id = auth.uid();

-- 5. Vérifier les données créées
SELECT 
    f.name as franchise_name,
    f.city,
    COUNT(ks.id) as nombre_sessions
FROM franchises f
LEFT JOIN kiosk_sessions ks ON f.id = ks.franchise_id
WHERE f.owner_id = auth.uid()
GROUP BY f.id, f.name, f.city;
