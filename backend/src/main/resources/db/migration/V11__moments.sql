-- MOMENTS: standalone reflections not tied to quests
CREATE TABLE IF NOT EXISTS moments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moments_user_created_at ON moments(user_id, created_at DESC);
