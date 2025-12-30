CREATE TABLE IF NOT EXISTS invites (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  inviter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(code);
CREATE INDEX IF NOT EXISTS idx_invites_inviter ON invites(inviter_id);