-- Manager Dashboard schema (tables + RLS)
-- Safe to run multiple times

-- Extensions (if needed)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==============================
-- Onboarding progress
-- ==============================
CREATE TABLE IF NOT EXISTS onboarding_progress (
  user_id UUID NOT NULL,
  gym_id UUID NOT NULL,
  appairage_done BOOLEAN NOT NULL DEFAULT false,
  mission_done BOOLEAN NOT NULL DEFAULT false,
  fiche_done BOOLEAN NOT NULL DEFAULT false,
  suggestion_done BOOLEAN NOT NULL DEFAULT false,
  classement_done BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, gym_id)
);

-- ==============================
-- Actions du jour (recommandations)
-- ==============================
CREATE TABLE IF NOT EXISTS manager_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'recommendation',
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','completed','ignored')),
  ignored_reason TEXT NULL,
  impact_estimated JSONB NULL,
  impact_measured JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS idx_manager_actions_gym ON manager_actions(gym_id);
CREATE INDEX IF NOT EXISTS idx_manager_actions_state ON manager_actions(state);

-- ==============================
-- Notifications intelligentes
-- ==============================
CREATE TABLE IF NOT EXISTS manager_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info','warning','critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_manager_notifications_gym ON manager_notifications(gym_id);
CREATE INDEX IF NOT EXISTS idx_manager_notifications_created ON manager_notifications(created_at DESC);

-- ==============================
-- RLS
-- ==============================
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_notifications ENABLE ROW LEVEL SECURITY;

-- Helper: managers can access rows of their gyms (gyms.manager_id = auth.uid())
DROP POLICY IF EXISTS onboarding_progress_select ON onboarding_progress;
CREATE POLICY onboarding_progress_select ON onboarding_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gyms g WHERE g.id = onboarding_progress.gym_id AND g.manager_id = auth.uid()
    ) OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS onboarding_progress_modify ON onboarding_progress;
CREATE POLICY onboarding_progress_modify ON onboarding_progress
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM gyms g WHERE g.id = onboarding_progress.gym_id AND g.manager_id = auth.uid()
    ) OR auth.role() = 'service_role'
  );
-- Updates limited to same scope
DROP POLICY IF EXISTS onboarding_progress_update ON onboarding_progress;
CREATE POLICY onboarding_progress_update ON onboarding_progress
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM gyms g WHERE g.id = onboarding_progress.gym_id AND g.manager_id = auth.uid()
    ) OR auth.role() = 'service_role'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gyms g WHERE g.id = onboarding_progress.gym_id AND g.manager_id = auth.uid()
    ) OR auth.role() = 'service_role'
  );

-- manager_actions policies
DROP POLICY IF EXISTS manager_actions_select ON manager_actions;
CREATE POLICY manager_actions_select ON manager_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gyms g WHERE g.id = manager_actions.gym_id AND g.manager_id = auth.uid()
    ) OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS manager_actions_insert ON manager_actions;
CREATE POLICY manager_actions_insert ON manager_actions
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM gyms g WHERE g.id = manager_actions.gym_id AND g.manager_id = auth.uid()
    ) OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS manager_actions_update ON manager_actions;
CREATE POLICY manager_actions_update ON manager_actions
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM gyms g WHERE g.id = manager_actions.gym_id AND g.manager_id = auth.uid()
    ) OR auth.role() = 'service_role'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gyms g WHERE g.id = manager_actions.gym_id AND g.manager_id = auth.uid()
    ) OR auth.role() = 'service_role'
  );

-- manager_notifications policies (read-only for managers)
DROP POLICY IF EXISTS manager_notifications_select ON manager_notifications;
CREATE POLICY manager_notifications_select ON manager_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gyms g WHERE g.id = manager_notifications.gym_id AND g.manager_id = auth.uid()
    ) OR auth.role() = 'service_role'
  );

-- Grants (optional; Supabase sets defaults for anon/authenticated)
GRANT SELECT ON onboarding_progress, manager_actions, manager_notifications TO authenticated;
GRANT INSERT, UPDATE ON onboarding_progress, manager_actions TO authenticated;


