const pool = require('../db');

async function notifyInsert(userId, type, title, body, refId, refDate) {
  try {
    await pool.query(
      `INSERT INTO notification_log (user_id, type, title, body, ref_id, ref_date, status, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'unread', NOW())
       ON CONFLICT (user_id, type, ref_id, ref_date) DO NOTHING`,
      [userId, type, title, body, String(refId), refDate]
    );
  } catch (err) {
    console.error('notifyInsert error:', err.message);
  }
}

module.exports = { notifyInsert };