CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  domain TEXT NOT NULL,
  duration_sec INT NOT NULL,
  event_type TEXT NOT NULL,
  ts TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
CREATE INDEX IF NOT EXISTS idx_events_user_ts ON events(user_id, ts);
CREATE INDEX IF NOT EXISTS idx_events_domain_ts ON events(domain, ts);