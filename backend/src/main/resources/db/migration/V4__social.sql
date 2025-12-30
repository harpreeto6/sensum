-- Social features: friendships + buddy sessions + checkins

-- 1) Friendships (invite-only system will sit on top of this later)
CREATE TABLE IF NOT EXISTS friendships (
  id BIGSERIAL PRIMARY KEY,

  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- pending / accepted / blocked
  status TEXT NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Prevent duplicate rows for same pair direction
  CONSTRAINT uq_friendships_pair UNIQUE (user_id, friend_id),

  -- Prevent user friending themselves
  CONSTRAINT chk_friendships_not_self CHECK (user_id <> friend_id),

  -- Enforce valid statuses
  CONSTRAINT chk_friendships_status CHECK (status IN ('pending', 'accepted', 'blocked'))
);

CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- 2) Buddy sessions
CREATE TABLE IF NOT EXISTS buddy_sessions (
  id BIGSERIAL PRIMARY KEY,

  user_a_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- quiet_company / quest_together (you can rename later; just keep consistent)
  mode TEXT NOT NULL,

  duration_sec INT NOT NULL,

  -- active / ended (keep minimal)
  status TEXT NOT NULL DEFAULT 'active',

  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP NULL,

  CONSTRAINT chk_buddy_sessions_not_self CHECK (user_a_id <> user_b_id),
  CONSTRAINT chk_buddy_sessions_duration CHECK (duration_sec > 0),
  CONSTRAINT chk_buddy_sessions_status CHECK (status IN ('active', 'ended')),
  CONSTRAINT chk_buddy_sessions_mode CHECK (mode IN ('quiet_company', 'quest_together'))
);

CREATE INDEX IF NOT EXISTS idx_buddy_sessions_users ON buddy_sessions(user_a_id, user_b_id);
CREATE INDEX IF NOT EXISTS idx_buddy_sessions_started_at ON buddy_sessions(started_at);

-- 3) Buddy check-ins (good/stuck)
CREATE TABLE IF NOT EXISTS buddy_checkins (
  id BIGSERIAL PRIMARY KEY,

  session_id BIGINT NOT NULL REFERENCES buddy_sessions(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  status TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_buddy_checkins_status CHECK (status IN ('good', 'stuck'))
);

CREATE INDEX IF NOT EXISTS idx_buddy_checkins_session ON buddy_checkins(session_id);
CREATE INDEX IF NOT EXISTS idx_buddy_checkins_created_at ON buddy_checkins(created_at);