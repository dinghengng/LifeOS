const pool = require('../db');
const { notifyInsert } = require('./notifyInsert');

const MILESTONES = [2, 4, 7, 14, 30, 60, 100];

async function runStreakMilestones() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { rows: habits } = await pool.query(`
      SELECT id, name, user_id, streak FROM habits
      WHERE streak = ANY($1)
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