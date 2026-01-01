ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS tracked_domains TEXT NOT NULL DEFAULT '[]';