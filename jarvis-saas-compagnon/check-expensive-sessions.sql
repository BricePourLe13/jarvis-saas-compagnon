-- 🔍 Script pour identifier les sessions coûteuses (ancien modèle GPT-4o)
-- À exécuter dans Supabase SQL Editor

-- 1️⃣ IDENTIFIER LES SESSIONS COÛTEUSES
SELECT 
  id,
  gym_id,
  timestamp,
  total_cost,
  duration_seconds,
  (total_cost / (duration_seconds / 60.0)) as cost_per_minute,
  text_input_tokens + text_output_tokens + audio_input_tokens + audio_output_tokens as total_tokens,
  error_occurred
FROM jarvis_session_costs 
WHERE total_cost > 1.0 -- Sessions coûtant plus de $1 USD
ORDER BY total_cost DESC
LIMIT 20;

-- 2️⃣ STATISTIQUES PAR TRANCHE DE COÛT
SELECT 
  CASE 
    WHEN total_cost < 0.10 THEN '< $0.10 (GPT-4o Mini)'
    WHEN total_cost < 0.50 THEN '$0.10 - $0.50'
    WHEN total_cost < 1.00 THEN '$0.50 - $1.00'
    WHEN total_cost < 2.00 THEN '$1.00 - $2.00 (GPT-4o)'
    ELSE '> $2.00 (GPT-4o cher)'
  END as cost_range,
  COUNT(*) as session_count,
  AVG(total_cost) as avg_cost,
  SUM(total_cost) as total_cost_sum
FROM jarvis_session_costs 
WHERE timestamp > now() - INTERVAL '7 days'
GROUP BY 1
ORDER BY avg_cost DESC;

-- 3️⃣ SESSIONS D'AUJOURD'HUI PAR COÛT
SELECT 
  gym_id,
  COUNT(*) as sessions_today,
  AVG(total_cost) as avg_cost_today,
  SUM(total_cost) as total_cost_today,
  MIN(total_cost) as min_cost,
  MAX(total_cost) as max_cost
FROM jarvis_session_costs 
WHERE timestamp >= CURRENT_DATE 
GROUP BY gym_id
ORDER BY avg_cost_today DESC;

-- 4️⃣ OPTIONNEL : SUPPRIMER LES SESSIONS DE TEST COÛTEUSES
-- ⚠️ ATTENTION : Décommentez seulement si vous êtes sûr !
-- DELETE FROM jarvis_session_costs 
-- WHERE total_cost > 2.0 
-- AND (
--   duration_seconds < 60 OR -- Sessions très courtes
--   timestamp < now() - INTERVAL '1 day' -- Sessions de plus de 24h
-- );

-- 5️⃣ MARQUER LES SESSIONS COMME "ANCIEN MODÈLE"
-- Ajouter une colonne pour identifier le modèle utilisé
ALTER TABLE jarvis_session_costs 
ADD COLUMN IF NOT EXISTS model_used TEXT DEFAULT 'gpt-4o-mini-realtime';

-- Marquer les sessions coûteuses comme ancien modèle
UPDATE jarvis_session_costs 
SET model_used = 'gpt-4o-realtime' 
WHERE total_cost > 1.0 AND model_used IS NULL;

-- Marquer les nouvelles sessions comme mini
UPDATE jarvis_session_costs 
SET model_used = 'gpt-4o-mini-realtime' 
WHERE total_cost <= 1.0 AND model_used IS NULL; 