const pool = require('../db');
const { notifyInsert } = require('./notifyInsert');
const { sendGoalDeadlineEmail } = require('../services/emailService');
const { isQuietHours } = require('./quietHours');

const WARN_DAYS = [7, 3, 1]; //send alerts on these days

async function runGoalDeadlineAlerts() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // DEBUG
    const raw = await pool.query(`SELECT current_database() AS db, current_user AS usr, now() AS server_time`);
    console.log('[GoalDeadline] connection info:', raw.rows[0]);
    const allGoals = await pool.query(`SELECT id, user_id, title, due_date, progress FROM goals WHERE user_id = 1`);
    console.log('[GoalDeadline] all goals for user 1:', JSON.stringify(allGoals.rows));

    const { rows: goals } = await pool.query(`
      SELECT g.id, g.title, g.user_id, g.due_date, u.email, np.quiet_start, np.quiet_end
      FROM goals g
      JOIN users u ON u.id = g.user_id
      LEFT JOIN notification_preferences np ON g.user_id = np.user_id
      WHERE g.progress < 100
        AND g.due_date IS NOT NULL
        AND g.due_date::date >= CURRENT_DATE
        AND g.due_date::date <= CURRENT_DATE + INTERVAL '7 days'
        AND COALESCE(np.goal_deadlines, true) = true
    `);
    // DEBUG
    console.log('[GoalDeadline] goals found:', goals.length, JSON.stringify(goals));

    for (const goal of goals) {
      const dueDate = new Date(goal.due_date);
      const now = new Date();
      const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
      // DEBUG
      console.log('[GoalDeadline] goal', goal.id, 'daysLeft:', daysLeft, 'in WARN_DAYS:', WARN_DAYS.includes(daysLeft));

      if (!WARN_DAYS.includes(daysLeft)) continue;

      await notifyInsert(
        goal.user_id,
        'goal_nudge',
        { goalTitle: goal.title, daysLeft },
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