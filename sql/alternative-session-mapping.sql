-- 🔄 ALTERNATIVE: Créer un mapping entre sessions OpenAI et UUIDs internes
-- 
-- Cette approche garde la structure UUID mais crée une table de correspondance

-- Table de mapping session OpenAI → UUID interne
CREATE TABLE IF NOT EXISTS openai_session_mapping (
  internal_session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  openai_session_id TEXT UNIQUE NOT NULL, -- sess_xxxxx
  created_at TIMESTAMPTZ DEFAULT NOW(),
  gym_id UUID NOT NULL,
  member_id UUID
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_session_mapping_openai ON openai_session_mapping(openai_session_id);

-- Fonction pour obtenir ou créer un UUID interne
CREATE OR REPLACE FUNCTION get_internal_session_id(
  p_openai_session_id TEXT,
  p_gym_id UUID,
  p_member_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_internal_id UUID;
BEGIN
  -- Essayer de récupérer l'UUID existant
  SELECT internal_session_id INTO v_internal_id
  FROM openai_session_mapping 
  WHERE openai_session_id = p_openai_session_id;
  
  -- Si pas trouvé, créer un nouveau mapping
  IF v_internal_id IS NULL THEN
    INSERT INTO openai_session_mapping (openai_session_id, gym_id, member_id)
    VALUES (p_openai_session_id, p_gym_id, p_member_id)
    RETURNING internal_session_id INTO v_internal_id;
  END IF;
  
  RETURN v_internal_id;
END;
$$ LANGUAGE plpgsql;

-- 🧪 TEST
SELECT get_internal_session_id('sess_C5rsbqH1x3Kvchecgdcxc', '42f6adf0-f222-4018-bb19-4f60e2a351f4'::UUID);
