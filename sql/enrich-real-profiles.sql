-- ===============================================
-- ENRICHISSEMENT PROFILS RÉELS POUR TEST DÉMONSTRATION
-- ===============================================

-- 🎯 PROFILS IDENTIFIÉS POUR ENRICHISSEMENT :
-- 1. Alex Chen (BADGE_003) - 342 visites → Expert actif
-- 2. Pierre Martin (BADGE_001) - 156 visites → Régulier expérimenté  
-- 3. Sophie Dubois (BADGE_002) - 87 visites → Intermédiaire sociale
-- 4. Thomas Martin (BADGE0002) - 8 visites récentes → Débutant motivé
-- 5. Marie Dubois (BADGE0001) - 1 visite récente → Nouvelle adhérente

-- 👤 ALEX CHEN - Expert Fitness (342 visites)
UPDATE gym_members 
SET 
  -- Fitness profil expert
  fitness_level = 'expert',
  fitness_goals = '["build_muscle", "strength", "performance"]'::jsonb,
  target_weight_kg = 78.0,
  current_weight_kg = 75.0,
  height_cm = 175,
  body_fat_percentage = 10.5,
  
  -- Préférences workout intense
  preferred_workout_times = '["06:00-07:30", "19:00-21:00"]'::jsonb,
  workout_frequency_per_week = 6,
  preferred_workout_duration = 90,
  favorite_equipment = '["barbell", "dumbbells", "bench_press", "squat_rack", "deadlift"]'::jsonb,
  avoided_equipment = '["treadmill", "elliptical"]'::jsonb,
  
  -- Santé optimisée
  dietary_restrictions = '[]'::jsonb,
  medical_conditions = '[]'::jsonb,
  
  -- Mental & social - focus performance
  motivation_type = 'performance',
  workout_style = 'intense',
  social_preference = 'solo',
  music_preferences = '["electronic", "rock"]'::jsonb,
  coaching_interest = false,
  
  -- Profil conversationnel JARVIS - expert direct
  communication_style = 'direct',
  conversation_topics_of_interest = '["technique", "progress", "nutrition", "advanced_training"]'::jsonb,
  jarvis_interaction_frequency = 'minimal',
  preferred_feedback_style = 'detailed',
  
  -- Objectifs avancés
  current_goals = '["bench_press_120kg", "deadlift_180kg", "compete_powerlifting"]'::jsonb,
  completed_goals = '["squat_150kg", "bench_100kg", "deadlift_160kg", "sub_15_bodyfat"]'::jsonb,
  goal_achievement_rate = 0.95,
  
  -- Comportement champion
  engagement_level = 'champion',
  consistency_score = 0.98,
  avg_session_duration_minutes = 90,
  favorite_visit_days = '["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]'::jsonb,
  peak_visit_hours = '["06:30", "19:30"]'::jsonb,
  
  -- Méta - profil très complet
  profile_completeness_percent = 98,
  last_profile_update = NOW()

WHERE id = '8b28c7c3-45be-4c2d-baf4-d642ee9d4996';

-- 👤 PIERRE MARTIN - Régulier Expérimenté (156 visites)
UPDATE gym_members 
SET 
  -- Fitness profil avancé
  fitness_level = 'advanced',
  fitness_goals = '["build_muscle", "endurance", "health"]'::jsonb,
  target_weight_kg = 80.0,
  current_weight_kg = 82.0,
  height_cm = 178,
  body_fat_percentage = 15.0,
  
  -- Préférences workout équilibrées
  preferred_workout_times = '["18:00-20:00"]'::jsonb,
  workout_frequency_per_week = 4,
  preferred_workout_duration = 75,
  favorite_equipment = '["weights", "cable_machine", "treadmill", "rowing"]'::jsonb,
  avoided_equipment = '["heavy_deadlifts"]'::jsonb,
  
  -- Santé - attention au dos
  dietary_restrictions = '[]'::jsonb,
  medical_conditions = '["lower_back_sensitivity"]'::jsonb,
  
  -- Mental & social - équilibré
  motivation_type = 'health',
  workout_style = 'moderate',
  social_preference = 'mixed',
  music_preferences = '["pop", "rock"]'::jsonb,
  coaching_interest = true,
  
  -- Profil conversationnel JARVIS - amical
  communication_style = 'friendly',
  conversation_topics_of_interest = '["technique", "motivation", "health", "equipment"]'::jsonb,
  jarvis_interaction_frequency = 'normal',
  preferred_feedback_style = 'encouraging',
  
  -- Objectifs réalistes
  current_goals = '["lose_2kg", "improve_back_strength", "consistent_4x_week"]'::jsonb,
  completed_goals = '["reach_150_visits", "master_basic_form", "establish_routine"]'::jsonb,
  goal_achievement_rate = 0.80,
  
  -- Comportement régulier
  engagement_level = 'regular',
  consistency_score = 0.85,
  avg_session_duration_minutes = 75,
  favorite_visit_days = '["tuesday", "thursday", "saturday", "sunday"]'::jsonb,
  peak_visit_hours = '["18:30"]'::jsonb,
  
  -- Méta - bon profil
  profile_completeness_percent = 88,
  last_profile_update = NOW()

WHERE id = '3663c1b6-cc68-47e3-8cfe-698422cd9331';

-- 👤 SOPHIE DUBOIS - Intermédiaire Sociale (87 visites)
UPDATE gym_members 
SET 
  -- Fitness profil intermédiaire
  fitness_level = 'intermediate',
  fitness_goals = '["flexibility", "stress_relief", "social", "tone_muscle"]'::jsonb,
  target_weight_kg = 62.0,
  current_weight_kg = 65.0,
  height_cm = 168,
  body_fat_percentage = 22.0,
  
  -- Préférences workout sociales
  preferred_workout_times = '["17:30-19:30"]'::jsonb,
  workout_frequency_per_week = 3,
  preferred_workout_duration = 60,
  favorite_equipment = '["yoga_mat", "pilates", "light_weights", "group_classes"]'::jsonb,
  avoided_equipment = '["heavy_machines", "barbell"]'::jsonb,
  
  -- Santé - végétarienne active
  dietary_restrictions = '["vegetarian"]'::jsonb,
  medical_conditions = '[]'::jsonb,
  
  -- Mental & social - très sociale
  motivation_type = 'stress_relief',
  workout_style = 'moderate',
  social_preference = 'large_group',
  music_preferences = '["pop", "indie", "ambient"]'::jsonb,
  coaching_interest = true,
  
  -- Profil conversationnel JARVIS - social et motivant
  communication_style = 'motivational',
  conversation_topics_of_interest = '["motivation", "schedule", "social", "wellness"]'::jsonb,
  jarvis_interaction_frequency = 'frequent',
  preferred_feedback_style = 'encouraging',
  
  -- Objectifs bien-être
  current_goals = '["attend_yoga_2x_week", "make_gym_friends", "lose_3kg_healthily"]'::jsonb,
  completed_goals = '["join_gym", "first_group_class", "consistent_month"]'::jsonb,
  goal_achievement_rate = 0.70,
  
  -- Comportement casual mais engagé
  engagement_level = 'regular',
  consistency_score = 0.75,
  avg_session_duration_minutes = 60,
  favorite_visit_days = '["wednesday", "friday", "saturday"]'::jsonb,
  peak_visit_hours = '["18:00"]'::jsonb,
  
  -- Méta - profil social développé
  profile_completeness_percent = 82,
  last_profile_update = NOW()

WHERE id = '02cdb76c-a920-4d26-a58b-ffa177fb0093';

-- 👤 THOMAS MARTIN - Débutant Motivé (8 visites récentes)
UPDATE gym_members 
SET 
  -- Fitness profil débutant
  fitness_level = 'beginner',
  fitness_goals = '["lose_weight", "build_muscle", "learn_basics"]'::jsonb,
  target_weight_kg = 75.0,
  current_weight_kg = 85.0,
  height_cm = 180,
  body_fat_percentage = 25.0,
  
  -- Préférences workout débutant
  preferred_workout_times = '["19:00-21:00"]'::jsonb,
  workout_frequency_per_week = 3,
  preferred_workout_duration = 45,
  favorite_equipment = '["treadmill", "basic_machines", "light_weights"]'::jsonb,
  avoided_equipment = '["complex_machines"]'::jsonb,
  
  -- Santé - débutant
  dietary_restrictions = '[]'::jsonb,
  medical_conditions = '[]'::jsonb,
  
  -- Mental & social - apprend
  motivation_type = 'health',
  workout_style = 'gentle',
  social_preference = 'small_group',
  music_preferences = '["pop", "motivational"]'::jsonb,
  coaching_interest = true,
  
  -- Profil conversationnel JARVIS - besoin de guidance
  communication_style = 'motivational',
  conversation_topics_of_interest = '["basics", "motivation", "technique", "beginner_tips"]'::jsonb,
  jarvis_interaction_frequency = 'frequent',
  preferred_feedback_style = 'encouraging',
  
  -- Objectifs débutant
  current_goals = '["lose_10kg", "learn_proper_form", "consistent_3x_week"]'::jsonb,
  completed_goals = '["join_gym", "first_week_completed"]'::jsonb,
  goal_achievement_rate = 0.40,
  
  -- Comportement nouveau mais régulier
  engagement_level = 'casual',
  consistency_score = 0.60,
  avg_session_duration_minutes = 45,
  favorite_visit_days = '["monday", "wednesday", "friday"]'::jsonb,
  peak_visit_hours = '["19:30"]'::jsonb,
  
  -- Méta - profil en développement
  profile_completeness_percent = 65,
  last_profile_update = NOW()

WHERE id = 'aff1a3f4-1b66-48da-9ca1-853c3351f66e';

-- 👤 MARIE DUBOIS - Nouvelle Adhérente (1 visite récente)
UPDATE gym_members 
SET 
  -- Fitness profil nouvelle
  fitness_level = 'beginner',
  fitness_goals = '["get_started", "lose_weight", "feel_better"]'::jsonb,
  target_weight_kg = 60.0,
  current_weight_kg = 68.0,
  height_cm = 165,
  
  -- Préférences workout très débutant
  preferred_workout_times = '["18:00-19:30"]'::jsonb,
  workout_frequency_per_week = 2,
  preferred_workout_duration = 30,
  favorite_equipment = '["treadmill", "easy_machines"]'::jsonb,
  avoided_equipment = '["weights", "complex_equipment"]'::jsonb,
  
  -- Santé - débutante
  dietary_restrictions = '[]'::jsonb,
  medical_conditions = '[]'::jsonb,
  
  -- Mental & social - timide mais motivée
  motivation_type = 'health',
  workout_style = 'gentle',
  social_preference = 'solo',
  music_preferences = '["pop", "feel_good"]'::jsonb,
  coaching_interest = true,
  
  -- Profil conversationnel JARVIS - très encourageant
  communication_style = 'motivational',
  conversation_topics_of_interest = '["basics", "motivation", "beginner_friendly"]'::jsonb,
  jarvis_interaction_frequency = 'normal',
  preferred_feedback_style = 'encouraging',
  
  -- Objectifs très débutant
  current_goals = '["come_to_gym_regularly", "lose_first_2kg", "feel_comfortable"]'::jsonb,
  completed_goals = '["join_gym"]'::jsonb,
  goal_achievement_rate = 0.20,
  
  -- Comportement tout nouveau
  engagement_level = 'new',
  consistency_score = 0.30,
  avg_session_duration_minutes = 30,
  favorite_visit_days = '["tuesday", "thursday"]'::jsonb,
  peak_visit_hours = '["18:30"]'::jsonb,
  
  -- Méta - profil basique
  profile_completeness_percent = 55,
  last_profile_update = NOW()

WHERE id = '5222c469-6b50-441a-b905-8598043eb24d';

-- 📊 MISE À JOUR AUTOMATIQUE DES SCORES
UPDATE gym_members 
SET jarvis_personalization_score = calculate_personalization_score(id)
WHERE id IN (
  '8b28c7c3-45be-4c2d-baf4-d642ee9d4996',
  '3663c1b6-cc68-47e3-8cfe-698422cd9331', 
  '02cdb76c-a920-4d26-a58b-ffa177fb0093',
  'aff1a3f4-1b66-48da-9ca1-853c3351f66e',
  '5222c469-6b50-441a-b905-8598043eb24d'
);

-- 🔍 VÉRIFICATION DES PROFILS ENRICHIS
SELECT 
  first_name,
  last_name,
  badge_id,
  fitness_level,
  engagement_level,
  communication_style,
  jarvis_personalization_score,
  profile_completeness_percent,
  fitness_goals,
  favorite_equipment
FROM gym_members 
WHERE id IN (
  '8b28c7c3-45be-4c2d-baf4-d642ee9d4996',
  '3663c1b6-cc68-47e3-8cfe-698422cd9331', 
  '02cdb76c-a920-4d26-a58b-ffa177fb0093',
  'aff1a3f4-1b66-48da-9ca1-853c3351f66e',
  '5222c469-6b50-441a-b905-8598043eb24d'
)
ORDER BY jarvis_personalization_score DESC;

