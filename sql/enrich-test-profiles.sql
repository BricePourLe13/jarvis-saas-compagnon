-- ===============================================
-- ENRICHISSEMENT PROFILS TEST POUR DÉMONSTRATION
-- ===============================================

-- 🎯 1. IDENTIFIER ET ENRICHIR LES MEILLEURS PROFILS TEST
-- (Exécute d'abord analyze-existing-profiles.sql pour identifier les IDs)

-- 📝 Template d'enrichissement - ADAPTER LES IDs selon tes données
-- Remplace 'MEMBER_ID_HERE' par les vrais IDs de tes membres

-- 👤 PROFIL 1 : MARIE (Débutante motivée)
UPDATE gym_members 
SET 
  -- Fitness profil
  fitness_level = 'beginner',
  fitness_goals = '["lose_weight", "endurance"]'::jsonb,
  target_weight_kg = 65.0,
  current_weight_kg = 72.0,
  height_cm = 165,
  
  -- Préférences workout
  preferred_workout_times = '["18:00-20:00", "19:00-21:00"]'::jsonb,
  workout_frequency_per_week = 3,
  preferred_workout_duration = 45,
  favorite_equipment = '["treadmill", "elliptical"]'::jsonb,
  avoided_equipment = '["heavy_weights"]'::jsonb,
  
  -- Santé & nutrition
  dietary_restrictions = '["lactose_intolerant"]'::jsonb,
  medical_conditions = '[]'::jsonb,
  
  -- Mental & social
  motivation_type = 'health',
  workout_style = 'moderate',
  social_preference = 'small_group',
  music_preferences = '["pop", "electronic"]'::jsonb,
  coaching_interest = true,
  
  -- Profil conversationnel JARVIS
  communication_style = 'motivational',
  conversation_topics_of_interest = '["motivation", "nutrition", "technique"]'::jsonb,
  jarvis_interaction_frequency = 'frequent',
  preferred_feedback_style = 'encouraging',
  
  -- Objectifs actuels
  current_goals = '["lose_5kg_in_3_months", "run_30min_without_stop"]'::jsonb,
  completed_goals = '["complete_first_workout"]'::jsonb,
  goal_achievement_rate = 0.75,
  
  -- Comportement
  engagement_level = 'regular',
  consistency_score = 0.80,
  avg_session_duration_minutes = 45,
  favorite_visit_days = '["monday", "wednesday", "friday"]'::jsonb,
  peak_visit_hours = '["19:00"]'::jsonb,
  
  -- Méta
  profile_completeness_percent = 85,
  last_profile_update = NOW()

WHERE id = 'MEMBER_ID_1_HERE'; -- ⚠️ REMPLACER PAR UN VRAI ID

-- 👤 PROFIL 2 : THOMAS (Expert intense)
UPDATE gym_members 
SET 
  -- Fitness profil
  fitness_level = 'expert',
  fitness_goals = '["build_muscle", "strength", "performance"]'::jsonb,
  target_weight_kg = 85.0,
  current_weight_kg = 80.0,
  height_cm = 180,
  body_fat_percentage = 12.5,
  
  -- Préférences workout
  preferred_workout_times = '["06:00-08:00", "18:00-20:00"]'::jsonb,
  workout_frequency_per_week = 5,
  preferred_workout_duration = 90,
  favorite_equipment = '["weights", "barbell", "bench_press", "deadlift"]'::jsonb,
  avoided_equipment = '["treadmill", "elliptical"]'::jsonb,
  
  -- Santé & nutrition
  dietary_restrictions = '[]'::jsonb,
  medical_conditions = '["previous_shoulder_injury"]'::jsonb,
  
  -- Mental & social
  motivation_type = 'performance',
  workout_style = 'intense',
  social_preference = 'solo',
  music_preferences = '["rock", "metal"]'::jsonb,
  coaching_interest = false,
  
  -- Profil conversationnel JARVIS
  communication_style = 'direct',
  conversation_topics_of_interest = '["technique", "progress", "nutrition"]'::jsonb,
  jarvis_interaction_frequency = 'minimal',
  preferred_feedback_style = 'detailed',
  
  -- Objectifs actuels
  current_goals = '["bench_press_100kg", "deadlift_150kg", "gain_5kg_muscle"]'::jsonb,
  completed_goals = '["squat_bodyweight", "pullup_15_reps", "lose_initial_weight"]'::jsonb,
  goal_achievement_rate = 0.90,
  
  -- Comportement
  engagement_level = 'champion',
  consistency_score = 0.95,
  avg_session_duration_minutes = 90,
  favorite_visit_days = '["monday", "tuesday", "thursday", "friday", "saturday"]'::jsonb,
  peak_visit_hours = '["07:00", "19:00"]'::jsonb,
  
  -- Méta
  profile_completeness_percent = 95,
  last_profile_update = NOW()

WHERE id = 'MEMBER_ID_2_HERE'; -- ⚠️ REMPLACER PAR UN VRAI ID

-- 👤 PROFIL 3 : SOPHIE (Casual social)
UPDATE gym_members 
SET 
  -- Fitness profil
  fitness_level = 'intermediate',
  fitness_goals = '["flexibility", "stress_relief", "social"]'::jsonb,
  target_weight_kg = 60.0,
  current_weight_kg = 62.0,
  height_cm = 168,
  
  -- Préférences workout
  preferred_workout_times = '["17:30-19:30"]'::jsonb,
  workout_frequency_per_week = 2,
  preferred_workout_duration = 60,
  favorite_equipment = '["yoga_mat", "pilates", "light_weights"]'::jsonb,
  avoided_equipment = '["heavy_machines"]'::jsonb,
  
  -- Santé & nutrition
  dietary_restrictions = '["vegan"]'::jsonb,
  medical_conditions = '["back_pain"]'::jsonb,
  
  -- Mental & social
  motivation_type = 'stress_relief',
  workout_style = 'gentle',
  social_preference = 'large_group',
  music_preferences = '["classical", "ambient"]'::jsonb,
  coaching_interest = true,
  
  -- Profil conversationnel JARVIS
  communication_style = 'friendly',
  conversation_topics_of_interest = '["motivation", "schedule", "social"]'::jsonb,
  jarvis_interaction_frequency = 'normal',
  preferred_feedback_style = 'encouraging',
  
  -- Objectifs actuels
  current_goals = '["attend_2_yoga_classes_per_week", "reduce_back_pain"]'::jsonb,
  completed_goals = '["join_gym", "first_yoga_class"]'::jsonb,
  goal_achievement_rate = 0.60,
  
  -- Comportement
  engagement_level = 'casual',
  consistency_score = 0.65,
  avg_session_duration_minutes = 60,
  favorite_visit_days = '["wednesday", "saturday"]'::jsonb,
  peak_visit_hours = '["18:00"]'::jsonb,
  
  -- Méta
  profile_completeness_percent = 70,
  last_profile_update = NOW()

WHERE id = 'MEMBER_ID_3_HERE'; -- ⚠️ REMPLACER PAR UN VRAI ID

-- 📊 4. METTRE À JOUR LES SCORES DE PERSONNALISATION
-- (Sera fait automatiquement par les triggers, mais on peut forcer)
UPDATE gym_members 
SET jarvis_personalization_score = calculate_personalization_score(id)
WHERE profile_completeness_percent > 50;

-- 🔍 5. VÉRIFIER LES PROFILS ENRICHIS
SELECT 
  first_name,
  fitness_level,
  fitness_goals,
  communication_style,
  engagement_level,
  jarvis_personalization_score,
  profile_completeness_percent
FROM gym_members 
WHERE profile_completeness_percent > 50
ORDER BY jarvis_personalization_score DESC;

