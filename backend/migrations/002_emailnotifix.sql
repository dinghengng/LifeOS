--Remove duplicates
DELETE FROM notification_log
WHERE id NOT IN (
  SELECT MIN(id)
  FROM notification_log
  GROUP BY user_id, type, ref_id, ref_date
);

--Add constraints
ALTER TABLE notification_log
ADD CONSTRAINT uq_notification_log_dedup
UNIQUE (user_id, type, ref_id, ref_date);

--Drop constraint
ALTER TABLE notification_log
DROP CONSTRAINT uq_notification_log_dedup;

--Replace with index
CREATE UNIQUE INDEX uq_notification_log_dedup
ON notification_log (user_id, type, ref_id, ref_date)
WHERE ref_id IS NOT NULL AND ref_date IS NOT NULL;