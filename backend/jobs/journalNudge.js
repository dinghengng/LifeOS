const pool = require('../db');
const { notifyInsert } = require('./notifyInsert');
const { sendJournalNudgeEmail } = require('../services/emailService');
const { isQuietHours } = require('./reminderJob');

async function runJournalNudge() {
  try {
    const today = new Date().toISOString().split('T')[0];

    //find users who have not written journal today
    const { rows: users } = await pool.query(`
      SELECT DISTINCT u.id
      FROM users u
      LEFT JOIN notification_preferences np ON u.id = np.user_id
      WHERE COALESCE(np.journal_nudge, true) = true
        AND NOT EXISTS (
            SELECT 1 FROM journal_entries je
            WHERE je.user_id = u.id
            AND je.created_at::date = CURRENT_DATE
        )
    `);

    for (const user of users) {
      await notifyInsert(
        user.id,
        'journal_nudge',
        'Daily Journal',
        "You haven't written anything today. Take 2 minutes to reflect.",
        `journal-${user.id}`,
        today
      );

      if (user.email && !isQuietHours(user.quiet_start, user.quiet_end)) {
        try {
          await sendJournalNudgeEmail({ to: user.email });
        } catch (err) {
          console.error(`[JournalNudgeEmail] Failed for user ${user.id}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error('journalNudge error:', err.message);
  }
}

module.exports = { runJournalNudge };