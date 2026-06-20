const pool = require('../db');
const { notifyInsert } = require('./notifyInsert');

const WARN_DAYS = [7, 3, 1]; //send alerts on these days

async function runGoalDeadlineAlerts() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { rows: goals } = await pool.query(`
      SELECT id, title, user_id, due_date
      FROM goals
      WHERE progress < 100
        AND due_date IS NOT NULL
        AND due_date >= CURRENT_DATE
        AND due_date <= CURRENT_DATE + INTERVAL '7 days'
    `);

    for (const goal of goals) {
      const dueDate = new Date(goal.due_date);
      const now = new Date();
      const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

      if (!WARN_DAYS.includes(daysLeft)) continue;

      const dayLabel = daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`;

      await notifyInsert(
        goal.user_id,
        'goal_nudge',
        'Goal Deadline Approaching',
        `"${goal.title}" is due ${dayLabel}. Lets get to it!`,
        goal.id,
        today
      );
    }
  } catch (err) {
    console.error('goalDeadlineAlerts error:', err.message);
  }
}

module.exports = { runGoalDeadlineAlerts };