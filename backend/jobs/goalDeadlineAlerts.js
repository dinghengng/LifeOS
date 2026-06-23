const pool = require('../db');
const { notifyInsert } = require('./notifyInsert');
const { sendGoalDeadlineEmail } = require('../services/emailService');
const { isQuietHours } = require('./quietHours');

const WARN_DAYS = [7, 3, 1]; //send alerts on these days

async function runGoalDeadlineAlerts() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { rows: goals } = await pool.query(`
      SELECT g.id, g.title, g.user_id, g.due_date, u.email, np.quiet_start, np.quiet_end
      FROM goals g
      JOIN users u ON u.id = g.user.id
      LEFT JOIN notification_preferences np ON g.user_id = np.user_id
      WHERE g.progress < 100
        AND g.due_date IS NOT NULL
        AND g.due_date >= CURRENT_DATE
        AND g.due_date <= CURRENT_DATE + INTERVAL '7 days'
        AND COALESCE(np.goal_deadlines, true) = true
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

      if (goal.email && !isQuietHours(goal.quiet_start, goal.quiet_end)) {
        try {
          await sendGoalDeadlineEmail({
            to: goal.email,
            goalTitle: goal.title,
            daysLeft,
          });
        } catch (err) {
          console.error(`[GoalDeadlineEmail] Failed for goal ${goal.id}:`, err.message);
        }
      }
      
    }
  } catch (err) {
    console.error('goalDeadlineAlerts error:', err.message);
  }
}

module.exports = { runGoalDeadlineAlerts };