-- Functions for reliable realtime session closure and cleanup

CREATE OR REPLACE FUNCTION close_realtime_session(
  p_session_id TEXT,
  p_reason TEXT DEFAULT 'user_goodbye'
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE openai_realtime_sessions
  SET session_ended_at = NOW(),
      session_duration_seconds = COALESCE(session_duration_seconds, EXTRACT(EPOCH FROM (NOW() - session_started_at)))::INT,
      session_metadata = jsonb_set(COALESCE(session_metadata, '{}'::jsonb), '{end_reason}', to_jsonb(p_reason), true)
  WHERE session_id = p_session_id AND session_ended_at IS NULL;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_inactive_realtime_sessions(
  p_gym_id UUID,
  p_inactive_minutes INTEGER DEFAULT 10
) RETURNS INTEGER AS $$
DECLARE
  v_closed INTEGER;
BEGIN
  WITH last_evt AS (
    SELECT s.id,
           GREATEST(s.session_started_at,
                    COALESCE(MAX(e.event_timestamp), s.session_started_at)) AS last_activity
    FROM openai_realtime_sessions s
    LEFT JOIN openai_realtime_audio_events e ON e.session_id = s.id
    WHERE s.gym_id = p_gym_id AND s.session_ended_at IS NULL
    GROUP BY s.id
  )
  UPDATE openai_realtime_sessions s
  SET session_ended_at = NOW(),
      session_duration_seconds = COALESCE(s.session_duration_seconds, EXTRACT(EPOCH FROM (NOW() - s.session_started_at)))::INT,
      session_metadata = jsonb_set(COALESCE(s.session_metadata, '{}'::jsonb), '{end_reason}', '"inactivity_timeout"'::jsonb, true)
  FROM last_evt l
  WHERE s.id = l.id
    AND l.last_activity < NOW() - make_interval(mins => p_inactive_minutes);

  GET DIAGNOSTICS v_closed = ROW_COUNT;
  RETURN v_closed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

