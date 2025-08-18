-- ===============================================
-- ANALYSE DES PROFILS EXISTANTS POST-MIGRATION
-- ===============================================

-- 🔍 1. VUE D'ENSEMBLE DES MEMBRES EXISTANTS
SELECT 
  id,
  first_name,
  last_name,
  badge_id,
  membership_type,
  total_visits,
  last_visit,
  created_at,
  -- Nouveaux champs (devraient être à leurs valeurs par défaut)
  fitness_level,
  engagement_level,
  jarvis_personalization_score,
  profile_completeness_percent
FROM gym_members 
ORDER BY created_at DESC
LIMIT 10;

-- 🎯 2. ÉTAT DES NOUVEAUX CHAMPS APRÈS MIGRATION
SELECT 
  COUNT(*) as total_members,
  COUNT(fitness_goals) as has_fitness_goals,
  COUNT(favorite_equipment) as has_equipment_prefs,
  COUNT(communication_style) as has_comm_style,
  AVG(jarvis_personalization_score) as avg_personalization_score,
  AVG(profile_completeness_percent) as avg_completeness
FROM gym_members;

-- 📊 3. RÉPARTITION PAR NIVEAU D'ENGAGEMENT
SELECT 
  engagement_level,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM gym_members), 2) as percentage
FROM gym_members 
GROUP BY engagement_level
ORDER BY count DESC;

-- 🏋️ 4. ANALYSE DES CHAMPS JSONB (devraient être des arrays vides)
SELECT 
  id,
  first_name,
  fitness_goals,
  favorite_equipment,
  dietary_restrictions,
  current_goals
FROM gym_members 
WHERE fitness_goals != '[]'::jsonb 
   OR favorite_equipment != '[]'::jsonb
   OR dietary_restrictions != '[]'::jsonb
LIMIT 5;

-- 🚨 5. VÉRIFIER LES CONTRAINTES ET VALEURS PAR DÉFAUT
SELECT 
  first_name,
  fitness_level,
  workout_style,
  social_preference,
  motivation_type,
  communication_style,
  jarvis_interaction_frequency,
  preferred_feedback_style
FROM gym_members 
LIMIT 5;

-- 📈 6. IDENTIFIER LES MEILLEURS CANDIDATS POUR TEST
SELECT 
  id,
  first_name,
  last_name,
  badge_id,
  total_visits,
  last_visit,
  CASE 
    WHEN total_visits > 50 THEN 'high_activity'
    WHEN total_visits > 10 THEN 'medium_activity' 
    ELSE 'low_activity'
  END as activity_level,
  CASE 
    WHEN last_visit > NOW() - INTERVAL '7 days' THEN 'recent_user'
    WHEN last_visit > NOW() - INTERVAL '30 days' THEN 'regular_user'
    ELSE 'inactive_user'
  END as recency
FROM gym_members 
WHERE is_active = true
ORDER BY total_visits DESC, last_visit DESC
LIMIT 10;
