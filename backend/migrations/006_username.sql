--noti bell fix
ALTER TABLE notification_log ADD COLUMN IF NOT EXISTS params JSONB;
--add username
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(30) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);