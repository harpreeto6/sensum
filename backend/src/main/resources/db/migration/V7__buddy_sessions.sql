-- Create buddy_sessions table
CREATE TABLE IF NOT EXISTS buddy_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_a_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode VARCHAR(50) NOT NULL,
    duration_minutes INT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create buddy_checkins table
CREATE TABLE IF NOT EXISTS buddy_checkins (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES buddy_sessions(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_buddy_sessions_user_a ON buddy_sessions(user_a_id);
CREATE INDEX IF NOT EXISTS idx_buddy_sessions_user_b ON buddy_sessions(user_b_id);
CREATE INDEX IF NOT EXISTS idx_buddy_checkins_session ON buddy_checkins(session_id);