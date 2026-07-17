ALTER TABLE habits ADD COLUMN total_days INTEGER DEFAULT 0;

UPDATE habits SET total_days = streak WHERE total_days < streak;

ALTER TABLE habits ADD COLUMN category VARCHAR(50);

-- Add supply tracking and streak columns to supplements table
ALTER TABLE supplements
  ADD COLUMN IF NOT EXISTS supply_count  INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS daily_dose    INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS streak        INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_taken_date DATE DEFAULT NULL;
-- last_taken_date is used by the backend to compute streak correctly on each toggle



CREATE TABLE IF NOT EXISTS supplement_logs (
  id SERIAL PRIMARY KEY,
  supplement_id INTEGER NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
  taken_at DATE NOT NULL,
  UNIQUE(supplement_id, taken_at) -- prevents duplicate logs for the same day
);

-- last_taken_date is no longer needed — supplement_logs is now the source of truth
ALTER TABLE supplements DROP COLUMN IF EXISTS last_taken_date;

ALTER TABLE supplements ADD COLUMN IF NOT EXISTS supply_unit TEXT DEFAULT 'pills';

-- Adds done/skipped distinction to habit_logs.
-- Every existing row is a completion, so backfill as 'done'.
ALTER TABLE habit_logs
  ADD COLUMN status TEXT NOT NULL DEFAULT 'done'
  CHECK (status IN ('done', 'skipped'));

-- One row per habit per day — enforce it so toggle/skip logic can rely on it.
-- Skip this if you already know your data is clean and the constraint would fail.
ALTER TABLE habit_logs
  ADD CONSTRAINT habit_logs_habit_day_unique UNIQUE (habit_id, completed_at);




CREATE TABLE IF NOT EXISTS goal_progress_logs (
  id SERIAL PRIMARY KEY,
  goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL,
  logged_at DATE NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Singapore')::date,
  UNIQUE(goal_id, logged_at)
);
