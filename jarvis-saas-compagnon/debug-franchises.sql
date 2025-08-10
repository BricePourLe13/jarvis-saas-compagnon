-- =======================================
-- 🔍 DEBUG DES FRANCHISES EXISTANTES
-- =======================================

-- 1. Compter toutes les franchises
SELECT 
  '📊 TOTAL FRANCHISES' AS section,
  COUNT(*) AS count
FROM franchises;

-- 2. Lister toutes les franchises avec leurs détails
SELECT 
  '🏢 DÉTAIL FRANCHISES' AS section,
  f.id,
  f.name,
  f.city,
  f.email,
  f.is_active,
  f.created_at,
  COUNT(g.id) AS gyms_count
FROM franchises f
LEFT JOIN gyms g ON f.id = g.franchise_id
GROUP BY f.id, f.name, f.city, f.email, f.is_active, f.created_at
ORDER BY f.created_at DESC;

-- 3. Vérifier les salles par franchise
SELECT 
  '🏋️ SALLES PAR FRANCHISE' AS section,
  f.name AS franchise_name,
  g.name AS gym_name,
  g.city AS gym_city,
  g.status,
  g.kiosk_config->>'is_provisioned' AS kiosk_provisioned
FROM franchises f
LEFT JOIN gyms g ON f.id = g.franchise_id
ORDER BY f.name, g.name;

-- 4. Statistiques globales
SELECT 
  '📈 STATISTIQUES GLOBALES' AS section,
  (SELECT COUNT(*) FROM franchises) AS total_franchises,
  (SELECT COUNT(*) FROM franchises WHERE is_active = true) AS active_franchises,
  (SELECT COUNT(*) FROM gyms) AS total_gyms,
  (SELECT COUNT(*) FROM gyms WHERE kiosk_config->>'is_provisioned' = 'true') AS active_kiosks;

-- 5. Si aucune franchise, afficher message
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM franchises) = 0 THEN
    RAISE NOTICE '⚠️  AUCUNE FRANCHISE TROUVÉE !';
    RAISE NOTICE 'Exécutez le fichier setup-test-franchises.sql pour créer des données de test.';
  ELSE
    RAISE NOTICE '✅ Franchises trouvées dans la base de données.';
  END IF;
END $$;