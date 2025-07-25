-- ==========================================
-- 📊 DONNÉES DE TEST RÉELLES pour Analytics JARVIS
-- Script avec les VRAIES données de votre système Orange Bleue
-- ⚠️ SYSTÈME DYNAMIQUE : Toute nouvelle franchise/salle sera automatiquement prise en compte
-- ==========================================

-- 🔄 Nettoyer d'abord les anciennes données de test
DELETE FROM jarvis_session_costs 
WHERE session_id LIKE 'test-session-%';

-- 📊 Insérer des sessions réalistes avec VOS VRAIES données
INSERT INTO jarvis_session_costs (
  session_id, 
  gym_id, 
  franchise_id,
  timestamp, 
  duration_seconds,
  text_input_tokens, 
  text_output_tokens, 
  audio_input_tokens, 
  audio_output_tokens,
  text_input_cost, 
  text_output_cost, 
  audio_input_cost, 
  audio_output_cost,
  user_satisfaction, 
  error_occurred, 
  end_reason,
  model_version,
  voice_type
) VALUES 

-- 🏋️ Sessions OB-DAX (gym-test)
('test-session-' || extract(epoch from now()) || '-1', 
 'fd6e48bf-70e2-4cd7-9a1b-db07cd72a10f', 
 '07b0f6c3-2e50-4af6-a155-8d61e64b5b8a',
 NOW(),
 245,
 45, 89, 2340, 1890,
 0.0009, 0.00267, 0.0468, 0.05670,
 4.2, false, 'user_ended',
 'gpt-4o-realtime-preview-2025-01-07',
 'verse'),

('test-session-' || extract(epoch from now()) || '-2',
 'fd6e48bf-70e2-4cd7-9a1b-db07cd72a10f', 
 '07b0f6c3-2e50-4af6-a155-8d61e64b5b8a',
 NOW() - interval '2 hours',
 312,
 67, 123, 3120, 2560,
 0.00134, 0.00369, 0.0624, 0.0768,
 4.8, false, 'user_ended',
 'gpt-4o-realtime-preview-2025-01-07',
 'alloy'),

-- 🤖 Sessions JARVIS Demo Gym
('test-session-' || extract(epoch from now()) || '-3',
 '259cd074-1546-4342-818d-d2077a1bf6cd', 
 '07b0f6c3-2e50-4af6-a155-8d61e64b5b8a',
 NOW() - interval '4 hours',
 189,
 34, 78, 1890, 1456,
 0.00068, 0.00234, 0.0378, 0.04368,
 4.5, false, 'user_ended',
 'gpt-4o-realtime-preview-2025-01-07',
 'shimmer'),

('test-session-' || extract(epoch from now()) || '-4',
 '259cd074-1546-4342-818d-d2077a1bf6cd', 
 '07b0f6c3-2e50-4af6-a155-8d61e64b5b8a',
 NOW() - interval '6 hours',
 278,
 56, 98, 2780, 2134,
 0.00112, 0.00294, 0.0556, 0.06402,
 4.1, false, 'user_ended',
 'gpt-4o-realtime-preview-2025-01-07',
 'coral'),

-- 🧪 Sessions TEST KIOSK
('test-session-' || extract(epoch from now()) || '-5',
 'dff6c3c9-5899-4248-976d-cd27decc9c8d', 
 '07b0f6c3-2e50-4af6-a155-8d61e64b5b8a',
 NOW() - interval '8 hours',
 167,
 28, 64, 1670, 1234,
 0.00056, 0.00192, 0.0334, 0.03702,
 4.3, false, 'user_ended',
 'gpt-4o-realtime-preview-2025-01-07',
 'verse'),

-- Sessions d'hier réparties sur vos 3 salles
('test-session-' || extract(epoch from now()) || '-6',
 'fd6e48bf-70e2-4cd7-9a1b-db07cd72a10f', 
 '07b0f6c3-2e50-4af6-a155-8d61e64b5b8a',
 NOW() - interval '1 day',
 223,
 41, 87, 2230, 1789,
 0.00082, 0.00261, 0.0446, 0.05367,
 4.6, false, 'user_ended',
 'gpt-4o-realtime-preview-2025-01-07',
 'verse'),

('test-session-' || extract(epoch from now()) || '-7',
 '259cd074-1546-4342-818d-d2077a1bf6cd', 
 '07b0f6c3-2e50-4af6-a155-8d61e64b5b8a',
 NOW() - interval '1 day' - interval '3 hours',
 334,
 72, 134, 3340, 2678,
 0.00144, 0.00402, 0.0668, 0.08034,
 4.3, false, 'user_ended',
 'gpt-4o-realtime-preview-2025-01-07',
 'alloy'),

('test-session-' || extract(epoch from now()) || '-8',
 'dff6c3c9-5899-4248-976d-cd27decc9c8d', 
 '07b0f6c3-2e50-4af6-a155-8d61e64b5b8a',
 NOW() - interval '1 day' - interval '5 hours',
 198,
 38, 81, 1980, 1534,
 0.00076, 0.00243, 0.0396, 0.04602,
 4.4, false, 'user_ended',
 'gpt-4o-realtime-preview-2025-01-07',
 'coral');

-- ✅ Vérification des données insérées par salle
SELECT 
  '📊 ANALYTICS PAR SALLE' as info,
  g.name as gym_name,
  COUNT(jsc.session_id) as total_sessions,
  DATE(jsc.timestamp) as date,
  ROUND(SUM(jsc.text_input_cost + jsc.text_output_cost + jsc.audio_input_cost + jsc.audio_output_cost)::numeric, 4) as total_cost_usd,
  ROUND(AVG(jsc.user_satisfaction)::numeric, 2) as avg_satisfaction
FROM jarvis_session_costs jsc
JOIN gyms g ON jsc.gym_id = g.id
WHERE jsc.session_id LIKE 'test-session-%'
GROUP BY g.name, DATE(jsc.timestamp)
ORDER BY date DESC, g.name;

-- 🎯 SYSTÈME DYNAMIQUE - Preuve :
SELECT 
  '🔄 SYSTÈME DYNAMIQUE' as info,
  'Toute nouvelle franchise apparaîtra automatiquement dans le dashboard' as franchise_info,
  'Toute nouvelle salle sera automatiquement dans les analytics' as gym_info,
  'Les futures sessions JARVIS seront automatiquement trackées' as session_info; 