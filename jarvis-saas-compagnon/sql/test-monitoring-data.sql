-- 🧪 TEST MONITORING - Insérer données de démonstration
-- Script pour tester le système avec des données réalistes

-- ====================================
-- 📊 INSÉRER MÉTRIQUES DE TEST
-- ====================================

-- Insérer des métriques pour chaque kiosk configuré
INSERT INTO kiosk_metrics (
  gym_id, 
  kiosk_slug, 
  cpu_usage, 
  memory_usage, 
  network_latency, 
  api_response_time,
  microphone_level,
  speaker_volume,
  audio_quality,
  temperature_cpu,
  collected_at
)
SELECT 
  g.id,
  g.kiosk_config->>'kiosk_url_slug',
  
  -- Métriques système réalistes
  (random() * 25 + 35)::DECIMAL(5,2), -- CPU entre 35-60%
  (random() * 30 + 45)::DECIMAL(5,2), -- RAM entre 45-75%
  (random() * 120 + 80)::INTEGER,     -- Latence entre 80-200ms
  (random() * 800 + 1200)::INTEGER,   -- API entre 1.2-2s
  
  -- Audio
  (random() * 20 + 70)::DECIMAL(5,2), -- Micro 70-90%
  (random() * 15 + 80)::DECIMAL(5,2), -- Volume 80-95%
  CASE (random() * 4)::INTEGER
    WHEN 0 THEN 'excellent'
    WHEN 1 THEN 'good'
    WHEN 2 THEN 'good'
    ELSE 'excellent'
  END,
  
  -- Température
  (random() * 15 + 45)::INTEGER,      -- Temp entre 45-60°C
  
  -- Timestamp récent
  now() - INTERVAL '5 minutes'
  
FROM gyms g 
WHERE g.kiosk_config->>'kiosk_url_slug' IS NOT NULL;

-- ====================================
-- 🚨 INSÉRER QUELQUES ALERTES DE TEST
-- ====================================

-- Alerte warning pour un kiosk (CPU un peu élevé)
INSERT INTO monitoring_alerts (
  gym_id,
  kiosk_slug,
  alert_type,
  severity,
  threshold_value,
  current_value,
  unit,
  title,
  description,
  recommended_action,
  status
)
SELECT 
  g.id,
  g.kiosk_config->>'kiosk_url_slug',
  'cpu_high',
  'warning',
  70.0,
  73.5,
  '%',
  'Utilisation CPU élevée',
  'Le CPU du kiosk dépasse le seuil de 70%',
  'Vérifier les processus en cours et redémarrer si nécessaire',
  'active'
FROM gyms g 
WHERE g.kiosk_config->>'kiosk_url_slug' IS NOT NULL
LIMIT 1;

-- Alerte info pour réseau lent
INSERT INTO monitoring_alerts (
  gym_id,
  kiosk_slug,
  alert_type,
  severity,
  threshold_value,
  current_value,
  unit,
  title,
  description,
  recommended_action,
  status
)
SELECT 
  g.id,
  g.kiosk_config->>'kiosk_url_slug',
  'network_slow',
  'info',
  200.0,
  245.0,
  'ms',
  'Latence réseau élevée',
  'La latence réseau est plus élevée que la normale',
  'Vérifier la connexion internet',
  'active'
FROM gyms g 
WHERE g.kiosk_config->>'kiosk_url_slug' IS NOT NULL
ORDER BY g.created_at DESC
LIMIT 1;

-- ====================================
-- 📋 INCIDENT DE TEST
-- ====================================

-- Incident résolu récemment
INSERT INTO kiosk_incidents (
  gym_id,
  kiosk_slug,
  incident_type,
  severity,
  title,
  description,
  affected_components,
  status,
  resolution_notes,
  detected_at,
  resolved_at,
  duration_minutes,
  sessions_affected
)
SELECT 
  g.id,
  g.kiosk_config->>'kiosk_url_slug',
  'network_issue',
  'medium',
  'Perte connexion temporaire',
  'Le kiosk a perdu la connexion internet pendant quelques minutes',
  ARRAY['network', 'api'],
  'resolved',
  'Connexion rétablie automatiquement après redémarrage du routeur',
  now() - INTERVAL '2 hours',
  now() - INTERVAL '1 hour 45 minutes',
  15,
  3
FROM gyms g 
WHERE g.kiosk_config->>'kiosk_url_slug' IS NOT NULL
LIMIT 1;

-- ====================================
-- ✅ VÉRIFICATION DES DONNÉES INSÉRÉES
-- ====================================

-- Compter ce qui a été inséré
SELECT 
  '✅ DONNÉES DE TEST INSÉRÉES' as status,
  (SELECT COUNT(*) FROM kiosk_metrics WHERE collected_at > now() - INTERVAL '10 minutes') as new_metrics,
  (SELECT COUNT(*) FROM monitoring_alerts WHERE status = 'active') as active_alerts,
  (SELECT COUNT(*) FROM kiosk_incidents WHERE detected_at > now() - INTERVAL '3 hours') as recent_incidents,
  now() as inserted_at;

-- ====================================
-- 📊 TESTER LA VUE STATUT
-- ====================================

-- Afficher le statut actuel de tous les kiosks
SELECT 
  '📊 STATUT KIOSKS AVEC DONNÉES TEST' as section,
  gym_name,
  kiosk_slug,
  online_status,
  COALESCE(cpu_usage::text || '%', 'N/A') as cpu,
  COALESCE(memory_usage::text || '%', 'N/A') as memory,
  COALESCE(network_latency::text || 'ms', 'N/A') as latency,
  active_alerts || ' alertes' as alerts,
  last_metrics
FROM v_kiosk_current_status
ORDER BY gym_name;

-- ====================================
-- 🎯 REQUÊTES DE VALIDATION
-- ====================================

-- 1. Métriques les plus récentes
SELECT 
  '🎯 MÉTRIQUES RÉCENTES' as test,
  kiosk_slug,
  cpu_usage || '%' as cpu,
  memory_usage || '%' as memory,
  network_latency || 'ms' as latency,
  audio_quality,
  collected_at
FROM kiosk_metrics 
WHERE collected_at > now() - INTERVAL '10 minutes'
ORDER BY collected_at DESC;

-- 2. Alertes actives
SELECT 
  '🚨 ALERTES ACTIVES' as test,
  kiosk_slug,
  alert_type,
  severity,
  title,
  current_value || unit as value_vs_threshold,
  threshold_value || unit as threshold
FROM monitoring_alerts 
WHERE status = 'active'
ORDER BY severity DESC, triggered_at DESC;

-- 3. Incidents récents
SELECT 
  '📋 INCIDENTS RÉCENTS' as test,
  kiosk_slug,
  incident_type,
  severity,
  title,
  status,
  CASE 
    WHEN status = 'resolved' THEN duration_minutes::text || ' min'
    ELSE 'En cours'
  END as duration
FROM kiosk_incidents 
WHERE detected_at > now() - INTERVAL '24 hours'
ORDER BY detected_at DESC;

-- ====================================
-- 💡 PROCHAINES ÉTAPES
-- ====================================

SELECT 
  '💡 SYSTÈME PRÊT' as status,
  'Monitoring fonctionnel avec données de test' as description,
  'Utilisez maintenant le MonitoringService en TypeScript' as next_step,
  'ou les requêtes de 04-monitoring-dashboard-queries.sql' as alternative;