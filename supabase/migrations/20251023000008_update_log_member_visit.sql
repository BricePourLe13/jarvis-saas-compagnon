-- ============================================================================
-- MIGRATION 008: UPDATE log_member_visit FUNCTION
-- Date: 2025-10-23
-- Description: Mise à jour de la fonction log_member_visit pour utiliser gym_members_v2
-- ============================================================================

CREATE OR REPLACE FUNCTION log_member_visit(
  p_badge_id TEXT,
  p_gym_slug TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  member_data JSONB,
  visit_id UUID,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_member_id UUID;
  v_gym_id UUID;
  v_visit_id UUID;
  v_member_data JSONB;
BEGIN
  -- 1. Trouver la salle par slug
  SELECT id INTO v_gym_id 
  FROM gyms 
  WHERE kiosk_config->>'kiosk_url_slug' = p_gym_slug;
  
  IF v_gym_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::jsonb, NULL::uuid, 'Salle introuvable'::text;
    RETURN;
  END IF;
  
  -- 2. Trouver le membre par badge
  SELECT id INTO v_member_id 
  FROM gym_members_v2 
  WHERE badge_id = p_badge_id 
  AND gym_id = v_gym_id 
  AND is_active = true;
  
  IF v_member_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::jsonb, NULL::uuid, 'Badge non reconnu'::text;
    RETURN;
  END IF;
  
  -- 3. Enregistrer la visite (si table member_visits existe)
  BEGIN
    INSERT INTO member_visits (member_id, gym_id, badge_scanned, jarvis_interactions)
    VALUES (v_member_id, v_gym_id, p_badge_id, 1)
    RETURNING id INTO v_visit_id;
  EXCEPTION
    WHEN undefined_table THEN
      -- Table member_visits n'existe pas encore, on continue sans erreur
      v_visit_id := NULL;
  END;
  
  -- 4. Mettre à jour les stats du membre
  UPDATE gym_members_v2 
  SET 
    total_visits = COALESCE(total_visits, 0) + 1,
    last_visit = NOW()
  WHERE id = v_member_id;
  
  -- 5. Récupérer les données complètes du membre
  SELECT row_to_json(m.*) INTO v_member_data
  FROM gym_members_v2 m
  WHERE m.id = v_member_id;
  
  -- 6. Retourner le succès avec données
  RETURN QUERY SELECT true, v_member_data, v_visit_id, 'Visite enregistrée avec succès'::text;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::jsonb, NULL::uuid, ('Erreur: ' || SQLERRM)::text;
END;
$$;

COMMENT ON FUNCTION log_member_visit IS 'Enregistre une visite membre et met à jour ses statistiques (utilise gym_members_v2)';

