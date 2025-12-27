-- USERS: account + progress stored here (simple)
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  streak INT NOT NULL DEFAULT 0,
  last_completed_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- SETTINGS: what paths they picked, privacy later, etc.
CREATE TABLE IF NOT EXISTS user_settings (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  selected_paths TEXT NOT NULL DEFAULT '[]', -- store JSON string like ["music","study"]
  nudge_threshold_sec INT NOT NULL DEFAULT 480
);

-- QUESTS: the quest catalog
CREATE TABLE IF NOT EXISTS quests (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  duration_sec INT NOT NULL,
  prompt TEXT NOT NULL
);

-- COMPLETIONS: each time user finishes a quest
CREATE TABLE IF NOT EXISTS quest_completions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id BIGINT NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  mood TEXT,
  moment_text TEXT,
  completed_at TIMESTAMP NOT NULL DEFAULT NOW()
);
