const pool = require('../db');
const { notifyInsert } = require('./notifyInsert');
const { sendStreakMilestoneEmail } = require('../services/emailService');
const { isQuietHours } = require('./quietHours');


const MILESTONES = [2, 4, 7, 14, 30, 60, 100];

async function runStreakMilestones() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { rows: habits } = await pool.query(`
      SELECT h.id, h.name, h.user_id, h.streak, u.email, np.quiet_start, np.quiet_end
      FROM habits h
      JOIN users u ON u.id = h.user_id
      LEFT JOIN notification_preferences np ON h.user_id = np.user_id
      WHERE streak = ANY($1)
        AND COALESCE(np.streak_milestone, true) = true
    `, [MILESTONES]);

    for (const habit of habits) {
      await notifyInsert(
        habit.user_id,
        'habit_milestone',
        { habitName: habit.name, streak: habit.streak },
        habit.id,
        today
      );

      if (habit.email && !isQuietHours(habit.quiet_start, habit.quiet_end)) {
        try {
          await sendStreakMilestoneEmail({
            to: habit.email,
            habitName: habit.name,
            streak: habit.streak,
          });
        } catch (err) {
          console.error(`[StreakMilestoneEmail] Failed for habit ${habit.id}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error('streakMilestones error:', err.message);
  }
}

module.exports = { runStreakMilestones };