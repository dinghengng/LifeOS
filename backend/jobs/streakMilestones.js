const pool = require('../db');
const { notifyInsert } = require('./notifyInsert');

const MILESTONES = [2, 4, 7, 14, 30, 60, 100];

async function runStreakMilestones() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { rows: habits } = await pool.query(`
      SELECT h.id, h.name, h.user_id, h.streak FROM habits h
      LEFT JOIN notification_preferences np ON h.user_id = np.user_id
      WHERE streak = ANY($1)
        AND COALESCE(np.streak_milestone, true) = true
    `, [MILESTONES]);

    for (const habit of habits) {
      await notifyInsert(
        habit.user_id,
        'habit_milestone',
        `${habit.streak}-Day Streak!`,
        `You hit a ${habit.streak}-day streak on "${habit.name}". Keep it up!`,
        habit.id,
        today
      );
    }
  } catch (err) {
    console.error('streakMilestones error:', err.message);
  }
}

module.exports = { runStreakMilestones };