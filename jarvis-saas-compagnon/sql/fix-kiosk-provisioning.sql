-- ⚡ CORRECTION URGENTE : Marquer le kiosk comme provisionné
-- Problème : Le kiosk gym-iy990xkt retourne 403 car il n'est pas marqué comme provisionné

-- 1. Vérifier l'état actuel du kiosk
SELECT 
  id,
  name,
  kiosk_config,
  status
FROM gyms 
WHERE kiosk_config->>'kiosk_url_slug' = 'gym-iy990xkt';

-- 2. Marquer le kiosk comme provisionné
UPDATE gyms 
SET kiosk_config = jsonb_set(
  COALESCE(kiosk_config, '{}'::jsonb),
  '{is_provisioned}',
  'true'::jsonb
)
WHERE kiosk_config->>'kiosk_url_slug' = 'gym-iy990xkt';

-- 3. Ajouter la date de provisioning
UPDATE gyms 
SET kiosk_config = jsonb_set(
  kiosk_config,
  '{provisioned_at}',
  to_jsonb(now()::text)
)
WHERE kiosk_config->>'kiosk_url_slug' = 'gym-iy990xkt';

-- 4. Ajouter last_heartbeat pour indiquer que le kiosk est actif
UPDATE gyms 
SET kiosk_config = jsonb_set(
  kiosk_config,
  '{last_heartbeat}',
  to_jsonb(now()::text)
)
WHERE kiosk_config->>'kiosk_url_slug' = 'gym-iy990xkt';

-- 5. Vérifier le résultat final
SELECT 
  id,
  name,
  kiosk_config,
  status
FROM gyms 
WHERE kiosk_config->>'kiosk_url_slug' = 'gym-iy990xkt'; 