-- Approach A migration (additive, backward-compatible)

-- 1) Add state machine columns on sessions
ALTER TABLE openai_realtime_sessions
  ADD COLUMN IF NOT EXISTS state TEXT CHECK (state IN ('pending','active','ending','closed')),
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_reason TEXT;

-- Initialize missing values for existing rows
UPDATE openai_realtime_sessions
SET state = COALESCE(state, CASE WHEN session_ended_at IS NULL THEN 'active' ELSE 'closed' END),
    last_activity_at = COALESCE(last_activity_at, session_started_at)
WHERE TRUE;

-- 2) Trigger to keep last_activity_at updated on audio events
CREATE OR REPLACE FUNCTION trg_update_session_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE openai_realtime_sessions
  SET last_activity_at = GREATEST(COALESCE(last_activity_at, NEW.event_timestamp), NEW.event_timestamp)
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS t_openai_events_update_last_activity ON openai_realtime_audio_events;
CREATE TRIGGER t_openai_events_update_last_activity
AFTER INSERT ON openai_realtime_audio_events
FOR EACH ROW
EXECUTE FUNCTION trg_update_session_last_activity();

-- 3) View v_openai_realtime_active_sessions_v2 (filter by state and freshness)
CREATE OR REPLACE VIEW v_openai_realtime_active_sessions_v2 AS
WITH filtered AS (
  SELECT 
    s.*,
    ROW_NUMBER() OVER (
      PARTITION BY s.gym_id, s.kiosk_slug, COALESCE(s.member_badge_id, 'unknown')
      ORDER BY COALESCE(s.last_activity_at, s.session_started_at) DESC, s.session_started_at DESC
    ) AS rn
  FROM openai_realtime_sessions s
  WHERE s.session_ended_at IS NULL
    AND COALESCE(s.state, 'active') = 'active'
    AND COALESCE(s.last_activity_at, s.session_started_at) > NOW() - INTERVAL '10 minutes'
    AND COALESCE(s.member_badge_id, '') NOT LIKE 'prewarm%'
)
SELECT *
FROM filtered
WHERE rn = 1;

-- 4) RPC pour incrémenter les tours (utilisé par instrumentation)
CREATE OR REPLACE FUNCTION increment_session_user_turns(p_session_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE openai_realtime_sessions
  SET total_user_turns = COALESCE(total_user_turns, 0) + 1,
      last_activity_at = NOW(),
      updated_at = NOW()
  WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_session_ai_turns(p_session_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE openai_realtime_sessions
  SET total_ai_turns = COALESCE(total_ai_turns, 0) + 1,
      last_activity_at = NOW(),
      updated_at = NOW()
  WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

