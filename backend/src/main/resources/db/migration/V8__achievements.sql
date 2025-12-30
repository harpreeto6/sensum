-- Create achievements table (master list of badges)
CREATE TABLE achievements (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    icon VARCHAR(50),
    trigger JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_achievements table (tracks who earned what)
CREATE TABLE user_achievements (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id BIGINT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- Add indexes for fast queries
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement ON user_achievements(achievement_id);

-- Insert default achievements
INSERT INTO achievements (name, description, icon, trigger) VALUES
('First Quest', 'Complete your first quest', '🎯', '{"type": "quest_count", "value": 1}'),
('Quest Master', 'Complete 10 quests', '⭐', '{"type": "quest_count", "value": 10}'),
('Consistent', 'Complete 30 quests', '💯', '{"type": "quest_count", "value": 30}'),
('Week on Fire', 'Maintain a 7-day streak', '🔥', '{"type": "streak", "value": 7}'),
('Level 5', 'Reach level 5', '🏆', '{"type": "level", "value": 5}'),
('Social Butterfly', 'Add 5 friends', '🦋', '{"type": "friend_count", "value": 5}'),
('Level 10', 'Reach level 10', '👑', '{"type": "level", "value": 10}'),
('Legend', 'Complete 100 quests', '🌟', '{"type": "quest_count", "value": 100}');