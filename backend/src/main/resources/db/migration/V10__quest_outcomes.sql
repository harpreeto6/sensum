-- Track all quest interactions (completed, skipped, snoozed)
CREATE TABLE IF NOT EXISTS quest_outcomes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id BIGINT NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  outcome TEXT NOT NULL CHECK (outcome IN ('completed', 'skipped', 'snoozed')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for fast lookups when calculating scores
CREATE INDEX IF NOT EXISTS idx_quest_outcomes_user_quest ON quest_outcomes(user_id, quest_id);
CREATE INDEX IF NOT EXISTS idx_quest_outcomes_user_outcome ON quest_outcomes(user_id, outcome);