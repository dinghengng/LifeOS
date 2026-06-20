const pool = require('../db');
const { notifyInsert } = require('./notifyInsert');

async function runJournalNudge() {
  try {
    const today = new Date().toISOString().split('T')[0];

    //find users who have not written journal today
    const { rows: users } = await pool.query(`
      SELECT DISTINCT u.id
      FROM users u
      WHERE NOT EXISTS (
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
    }
  } catch (err) {
    console.error('journalNudge error:', err.message);
  }
}

module.exports = { runJournalNudge };