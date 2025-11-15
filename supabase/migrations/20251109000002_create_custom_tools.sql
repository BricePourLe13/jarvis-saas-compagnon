-- ============================================
-- MIGRATION: Custom Tools System (No-Code)
-- Date: 2025-11-09
-- Description: Système de tools personnalisables par les gérants
-- ============================================

-- Types ENUM
CREATE TYPE tool_type AS ENUM (
  'api_rest',        -- Appel API externe (REST)
  'mcp_supabase',    -- Query Supabase via MCP
  'webhook',         -- POST vers webhook externe
  'javascript',      -- Script JS sandboxé (futur)
  'graphql',         -- Query GraphQL (futur)
  'database_query'   -- Query SQL directe (futur)
);

CREATE TYPE tool_auth_type AS ENUM (
  'none',
  'bearer_token',
  'api_key',
  'oauth2',
  'basic_auth'
);

CREATE TYPE tool_status AS ENUM (
  'draft',           -- En cours de création
  'active',          -- Actif et utilisable par JARVIS
  'paused',          -- Temporairement désactivé
  'deprecated'       -- Obsolète (gardé pour historique)
);

-- ============================================
-- TABLE: custom_tools
-- ============================================
CREATE TABLE IF NOT EXISTS custom_tools (
  -- Identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  
  -- Metadata
  name TEXT NOT NULL,                    -- Nom technique (snake_case)
  display_name TEXT NOT NULL,            -- Nom affiché UI
  description TEXT NOT NULL,             -- Description pour OpenAI
  category TEXT,                         -- 'booking', 'info', 'action', etc.
  icon TEXT DEFAULT '🔧',                -- Emoji ou nom icône
  
  -- Configuration technique
  type tool_type NOT NULL DEFAULT 'api_rest',
  status tool_status DEFAULT 'draft',
  
  -- Configuration exécution (JSONB flexible)
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Paramètres du tool (pour OpenAI function calling)
  parameters JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Authentification (si nécessaire)
  auth_type tool_auth_type DEFAULT 'none',
  auth_config JSONB DEFAULT '{}'::jsonb,
  
  -- Rate limiting
  rate_limit_per_member_per_day INTEGER DEFAULT 10,
  rate_limit_per_gym_per_hour INTEGER DEFAULT 100,
  
  -- Analytics & Monitoring
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  avg_execution_time_ms INTEGER DEFAULT 0,
  success_rate NUMERIC(5,2) DEFAULT 0.00,
  
  -- Validation & Tests
  test_cases JSONB DEFAULT '[]'::jsonb,
  last_test_result JSONB,
  last_test_at TIMESTAMPTZ,
  
  -- Métadonnées
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Contraintes
  UNIQUE(gym_id, name),
  CHECK (name ~ '^[a-z0-9_]+$'),
  CHECK (char_length(name) >= 3 AND char_length(name) <= 50),
  CHECK (char_length(display_name) >= 3 AND char_length(display_name) <= 100),
  CHECK (char_length(description) >= 10 AND char_length(description) <= 500),
  CHECK (rate_limit_per_member_per_day > 0 AND rate_limit_per_member_per_day <= 100),
  CHECK (rate_limit_per_gym_per_hour > 0 AND rate_limit_per_gym_per_hour <= 10000),
  CHECK (success_rate >= 0 AND success_rate <= 100)
);

-- Indexes pour performance
CREATE INDEX idx_custom_tools_gym_id ON custom_tools(gym_id);
CREATE INDEX idx_custom_tools_status ON custom_tools(status);
CREATE INDEX idx_custom_tools_type ON custom_tools(type);
CREATE INDEX idx_custom_tools_gym_status ON custom_tools(gym_id, status) WHERE status = 'active';
CREATE INDEX idx_custom_tools_created_at ON custom_tools(created_at DESC);

-- ============================================
-- TABLE: custom_tool_executions
-- ============================================
CREATE TABLE IF NOT EXISTS custom_tool_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID NOT NULL REFERENCES custom_tools(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  member_id UUID REFERENCES gym_members_v2(id) ON DELETE SET NULL,
  session_id TEXT,
  
  -- Inputs/Outputs
  input_args JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_result JSONB,
  
  -- Performance
  execution_time_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
  error_message TEXT,
  http_status_code INTEGER,
  
  -- Metadata
  executed_at TIMESTAMPTZ DEFAULT now(),
  
  -- Retention: supprimer automatiquement après 30 jours
  CONSTRAINT check_retention CHECK (executed_at > now() - INTERVAL '30 days')
);

-- Indexes pour logs
CREATE INDEX idx_custom_tool_executions_tool_id ON custom_tool_executions(tool_id);
CREATE INDEX idx_custom_tool_executions_gym_id ON custom_tool_executions(gym_id);
CREATE INDEX idx_custom_tool_executions_member_id ON custom_tool_executions(member_id);
CREATE INDEX idx_custom_tool_executions_executed_at ON custom_tool_executions(executed_at DESC);
CREATE INDEX idx_custom_tool_executions_status ON custom_tool_executions(status);

-- ============================================
-- FUNCTION: Mise à jour analytics
-- ============================================
CREATE OR REPLACE FUNCTION update_custom_tool_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer métriques des 7 derniers jours
  UPDATE custom_tools
  SET 
    usage_count = usage_count + 1,
    last_used_at = NEW.executed_at,
    avg_execution_time_ms = (
      SELECT COALESCE(AVG(execution_time_ms)::INTEGER, 0)
      FROM custom_tool_executions
      WHERE tool_id = NEW.tool_id
      AND executed_at > now() - INTERVAL '7 days'
      AND execution_time_ms IS NOT NULL
    ),
    success_rate = (
      SELECT COALESCE(
        (COUNT(*) FILTER (WHERE status = 'success')::NUMERIC / NULLIF(COUNT(*), 0) * 100),
        0
      )::NUMERIC(5,2)
      FROM custom_tool_executions
      WHERE tool_id = NEW.tool_id
      AND executed_at > now() - INTERVAL '7 days'
    ),
    updated_at = now()
  WHERE id = NEW.tool_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mise à jour analytics
CREATE TRIGGER trigger_update_custom_tool_analytics
  AFTER INSERT ON custom_tool_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_tool_analytics();

-- ============================================
-- FUNCTION: Trigger updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_custom_tools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_custom_tools_updated_at
  BEFORE UPDATE ON custom_tools
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_tools_updated_at();

-- ============================================
-- FUNCTION: Nettoyage logs anciens (cron job)
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_tool_executions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM custom_tool_executions
  WHERE executed_at < now() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  INSERT INTO system_logs (log_type, message, details)
  VALUES (
    'cleanup',
    'Nettoyage custom_tool_executions',
    jsonb_build_object('deleted_count', deleted_count)
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS (Row Level Security)
-- ============================================
ALTER TABLE custom_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_tool_executions ENABLE ROW LEVEL SECURITY;

-- Policy: Gym managers peuvent gérer leurs tools
CREATE POLICY "Gym managers can manage their tools"
  ON custom_tools
  FOR ALL
  USING (
    gym_id IN (
      SELECT gym_id 
      FROM users 
      WHERE id = auth.uid()
      AND role IN ('gym_manager', 'franchise_owner', 'super_admin')
    )
  );

-- Policy: Gym managers peuvent voir logs de leurs tools
CREATE POLICY "Gym managers can view their tool executions"
  ON custom_tool_executions
  FOR SELECT
  USING (
    gym_id IN (
      SELECT gym_id 
      FROM users 
      WHERE id = auth.uid()
      AND role IN ('gym_manager', 'franchise_owner', 'super_admin')
    )
  );

-- Service role peut tout (pour JARVIS runtime)
CREATE POLICY "Service role full access custom_tools"
  ON custom_tools
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access tool_executions"
  ON custom_tool_executions
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- DONNÉES INITIALES: Templates
-- ============================================

-- Template: Get gym hours (simple)
INSERT INTO custom_tools (
  gym_id,
  name,
  display_name,
  description,
  category,
  icon,
  type,
  status,
  config,
  parameters,
  created_by
) 
SELECT 
  g.id,
  'get_gym_hours',
  'Consulter horaires',
  'Retourne les horaires d''ouverture de la salle de sport',
  'info',
  '🕐',
  'mcp_supabase',
  'active',
  jsonb_build_object(
    'query_template', 'SELECT opening_hours FROM gyms WHERE id = ''' || g.id::text || '''',
    'max_rows', 1
  ),
  '[]'::jsonb,
  NULL
FROM gyms g
ON CONFLICT (gym_id, name) DO NOTHING;

-- ============================================
-- COMMENTAIRES
-- ============================================
COMMENT ON TABLE custom_tools IS 'Tools personnalisables créés par les gérants via dashboard';
COMMENT ON TABLE custom_tool_executions IS 'Logs d''exécution des custom tools (retention 30 jours)';

COMMENT ON COLUMN custom_tools.name IS 'Nom technique en snake_case (unique par gym)';
COMMENT ON COLUMN custom_tools.display_name IS 'Nom affiché dans l''interface utilisateur';
COMMENT ON COLUMN custom_tools.description IS 'Description utilisée par OpenAI pour comprendre quand utiliser ce tool';
COMMENT ON COLUMN custom_tools.config IS 'Configuration technique flexible selon le type (endpoint, query, etc.)';
COMMENT ON COLUMN custom_tools.parameters IS 'Schéma des paramètres attendus par OpenAI (JSON Schema format)';
COMMENT ON COLUMN custom_tools.auth_config IS 'Configuration authentification (credentials chiffrés)';
COMMENT ON COLUMN custom_tools.success_rate IS 'Taux de succès calculé sur les 7 derniers jours (0-100%)';

COMMENT ON COLUMN custom_tool_executions.input_args IS 'Arguments fournis par JARVIS lors de l''appel';
COMMENT ON COLUMN custom_tool_executions.output_result IS 'Résultat retourné par le tool';
COMMENT ON COLUMN custom_tool_executions.execution_time_ms IS 'Temps d''exécution en millisecondes';

-- ============================================
-- GRANTS (si nécessaire)
-- ============================================
-- Les policies RLS gèrent déjà les permissions

-- ============================================
-- FIN MIGRATION
-- ============================================



-- MIGRATION: Custom Tools System (No-Code)
-- Date: 2025-11-09
-- Description: Système de tools personnalisables par les gérants
-- ============================================

-- Types ENUM
CREATE TYPE tool_type AS ENUM (
  'api_rest',        -- Appel API externe (REST)
  'mcp_supabase',    -- Query Supabase via MCP
  'webhook',         -- POST vers webhook externe
  'javascript',      -- Script JS sandboxé (futur)
  'graphql',         -- Query GraphQL (futur)
  'database_query'   -- Query SQL directe (futur)
);

CREATE TYPE tool_auth_type AS ENUM (
  'none',
  'bearer_token',
  'api_key',
  'oauth2',
  'basic_auth'
);

CREATE TYPE tool_status AS ENUM (
  'draft',           -- En cours de création
  'active',          -- Actif et utilisable par JARVIS
  'paused',          -- Temporairement désactivé
  'deprecated'       -- Obsolète (gardé pour historique)
);

-- ============================================
-- TABLE: custom_tools
-- ============================================
CREATE TABLE IF NOT EXISTS custom_tools (
  -- Identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  
  -- Metadata
  name TEXT NOT NULL,                    -- Nom technique (snake_case)
  display_name TEXT NOT NULL,            -- Nom affiché UI
  description TEXT NOT NULL,             -- Description pour OpenAI
  category TEXT,                         -- 'booking', 'info', 'action', etc.
  icon TEXT DEFAULT '🔧',                -- Emoji ou nom icône
  
  -- Configuration technique
  type tool_type NOT NULL DEFAULT 'api_rest',
  status tool_status DEFAULT 'draft',
  
  -- Configuration exécution (JSONB flexible)
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Paramètres du tool (pour OpenAI function calling)
  parameters JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Authentification (si nécessaire)
  auth_type tool_auth_type DEFAULT 'none',
  auth_config JSONB DEFAULT '{}'::jsonb,
  
  -- Rate limiting
  rate_limit_per_member_per_day INTEGER DEFAULT 10,
  rate_limit_per_gym_per_hour INTEGER DEFAULT 100,
  
  -- Analytics & Monitoring
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  avg_execution_time_ms INTEGER DEFAULT 0,
  success_rate NUMERIC(5,2) DEFAULT 0.00,
  
  -- Validation & Tests
  test_cases JSONB DEFAULT '[]'::jsonb,
  last_test_result JSONB,
  last_test_at TIMESTAMPTZ,
  
  -- Métadonnées
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Contraintes
  UNIQUE(gym_id, name),
  CHECK (name ~ '^[a-z0-9_]+$'),
  CHECK (char_length(name) >= 3 AND char_length(name) <= 50),
  CHECK (char_length(display_name) >= 3 AND char_length(display_name) <= 100),
  CHECK (char_length(description) >= 10 AND char_length(description) <= 500),
  CHECK (rate_limit_per_member_per_day > 0 AND rate_limit_per_member_per_day <= 100),
  CHECK (rate_limit_per_gym_per_hour > 0 AND rate_limit_per_gym_per_hour <= 10000),
  CHECK (success_rate >= 0 AND success_rate <= 100)
);

-- Indexes pour performance
CREATE INDEX idx_custom_tools_gym_id ON custom_tools(gym_id);
CREATE INDEX idx_custom_tools_status ON custom_tools(status);
CREATE INDEX idx_custom_tools_type ON custom_tools(type);
CREATE INDEX idx_custom_tools_gym_status ON custom_tools(gym_id, status) WHERE status = 'active';
CREATE INDEX idx_custom_tools_created_at ON custom_tools(created_at DESC);

-- ============================================
-- TABLE: custom_tool_executions
-- ============================================
CREATE TABLE IF NOT EXISTS custom_tool_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID NOT NULL REFERENCES custom_tools(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  member_id UUID REFERENCES gym_members_v2(id) ON DELETE SET NULL,
  session_id TEXT,
  
  -- Inputs/Outputs
  input_args JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_result JSONB,
  
  -- Performance
  execution_time_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
  error_message TEXT,
  http_status_code INTEGER,
  
  -- Metadata
  executed_at TIMESTAMPTZ DEFAULT now(),
  
  -- Retention: supprimer automatiquement après 30 jours
  CONSTRAINT check_retention CHECK (executed_at > now() - INTERVAL '30 days')
);

-- Indexes pour logs
CREATE INDEX idx_custom_tool_executions_tool_id ON custom_tool_executions(tool_id);
CREATE INDEX idx_custom_tool_executions_gym_id ON custom_tool_executions(gym_id);
CREATE INDEX idx_custom_tool_executions_member_id ON custom_tool_executions(member_id);
CREATE INDEX idx_custom_tool_executions_executed_at ON custom_tool_executions(executed_at DESC);
CREATE INDEX idx_custom_tool_executions_status ON custom_tool_executions(status);

-- ============================================
-- FUNCTION: Mise à jour analytics
-- ============================================
CREATE OR REPLACE FUNCTION update_custom_tool_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer métriques des 7 derniers jours
  UPDATE custom_tools
  SET 
    usage_count = usage_count + 1,
    last_used_at = NEW.executed_at,
    avg_execution_time_ms = (
      SELECT COALESCE(AVG(execution_time_ms)::INTEGER, 0)
      FROM custom_tool_executions
      WHERE tool_id = NEW.tool_id
      AND executed_at > now() - INTERVAL '7 days'
      AND execution_time_ms IS NOT NULL
    ),
    success_rate = (
      SELECT COALESCE(
        (COUNT(*) FILTER (WHERE status = 'success')::NUMERIC / NULLIF(COUNT(*), 0) * 100),
        0
      )::NUMERIC(5,2)
      FROM custom_tool_executions
      WHERE tool_id = NEW.tool_id
      AND executed_at > now() - INTERVAL '7 days'
    ),
    updated_at = now()
  WHERE id = NEW.tool_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mise à jour analytics
CREATE TRIGGER trigger_update_custom_tool_analytics
  AFTER INSERT ON custom_tool_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_tool_analytics();

-- ============================================
-- FUNCTION: Trigger updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_custom_tools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_custom_tools_updated_at
  BEFORE UPDATE ON custom_tools
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_tools_updated_at();

-- ============================================
-- FUNCTION: Nettoyage logs anciens (cron job)
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_tool_executions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM custom_tool_executions
  WHERE executed_at < now() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  INSERT INTO system_logs (log_type, message, details)
  VALUES (
    'cleanup',
    'Nettoyage custom_tool_executions',
    jsonb_build_object('deleted_count', deleted_count)
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS (Row Level Security)
-- ============================================
ALTER TABLE custom_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_tool_executions ENABLE ROW LEVEL SECURITY;

-- Policy: Gym managers peuvent gérer leurs tools
CREATE POLICY "Gym managers can manage their tools"
  ON custom_tools
  FOR ALL
  USING (
    gym_id IN (
      SELECT gym_id 
      FROM users 
      WHERE id = auth.uid()
      AND role IN ('gym_manager', 'franchise_owner', 'super_admin')
    )
  );

-- Policy: Gym managers peuvent voir logs de leurs tools
CREATE POLICY "Gym managers can view their tool executions"
  ON custom_tool_executions
  FOR SELECT
  USING (
    gym_id IN (
      SELECT gym_id 
      FROM users 
      WHERE id = auth.uid()
      AND role IN ('gym_manager', 'franchise_owner', 'super_admin')
    )
  );

-- Service role peut tout (pour JARVIS runtime)
CREATE POLICY "Service role full access custom_tools"
  ON custom_tools
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access tool_executions"
  ON custom_tool_executions
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- DONNÉES INITIALES: Templates
-- ============================================

-- Template: Get gym hours (simple)
INSERT INTO custom_tools (
  gym_id,
  name,
  display_name,
  description,
  category,
  icon,
  type,
  status,
  config,
  parameters,
  created_by
) 
SELECT 
  g.id,
  'get_gym_hours',
  'Consulter horaires',
  'Retourne les horaires d''ouverture de la salle de sport',
  'info',
  '🕐',
  'mcp_supabase',
  'active',
  jsonb_build_object(
    'query_template', 'SELECT opening_hours FROM gyms WHERE id = ''' || g.id::text || '''',
    'max_rows', 1
  ),
  '[]'::jsonb,
  NULL
FROM gyms g
ON CONFLICT (gym_id, name) DO NOTHING;

-- ============================================
-- COMMENTAIRES
-- ============================================
COMMENT ON TABLE custom_tools IS 'Tools personnalisables créés par les gérants via dashboard';
COMMENT ON TABLE custom_tool_executions IS 'Logs d''exécution des custom tools (retention 30 jours)';

COMMENT ON COLUMN custom_tools.name IS 'Nom technique en snake_case (unique par gym)';
COMMENT ON COLUMN custom_tools.display_name IS 'Nom affiché dans l''interface utilisateur';
COMMENT ON COLUMN custom_tools.description IS 'Description utilisée par OpenAI pour comprendre quand utiliser ce tool';
COMMENT ON COLUMN custom_tools.config IS 'Configuration technique flexible selon le type (endpoint, query, etc.)';
COMMENT ON COLUMN custom_tools.parameters IS 'Schéma des paramètres attendus par OpenAI (JSON Schema format)';
COMMENT ON COLUMN custom_tools.auth_config IS 'Configuration authentification (credentials chiffrés)';
COMMENT ON COLUMN custom_tools.success_rate IS 'Taux de succès calculé sur les 7 derniers jours (0-100%)';

COMMENT ON COLUMN custom_tool_executions.input_args IS 'Arguments fournis par JARVIS lors de l''appel';
COMMENT ON COLUMN custom_tool_executions.output_result IS 'Résultat retourné par le tool';
COMMENT ON COLUMN custom_tool_executions.execution_time_ms IS 'Temps d''exécution en millisecondes';

-- ============================================
-- GRANTS (si nécessaire)
-- ============================================
-- Les policies RLS gèrent déjà les permissions

-- ============================================
-- FIN MIGRATION
-- ============================================



