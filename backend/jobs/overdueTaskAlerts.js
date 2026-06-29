const pool = require('../db');
const { sendToUser } = require('../services/notificationService');
const { sendOverdueTaskEmail } = require('../services/emailService');
const { isQuietHours } = require('./quietHours');

async function runOverdueTaskAlerts() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { rows: tasks } = await pool.query(`
      SELECT t.id, t.title, t.due_date, t.user_id, u.email,
             np.quiet_start, np.quiet_end
      FROM tasks t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN notification_preferences np ON t.user_id = np.user_id
      WHERE t.is_completed = false
        AND t.due_date IS NOT NULL
        AND t.due_date < NOW()
        AND COALESCE(np.overdue_tasks, true) = true
    `);

    for (const task of tasks) {
      // only alert once per day
      const { rowCount } = await pool.query(
        `INSERT INTO notification_log (user_id, type, title, body, ref_id, ref_date, status, sent_at)
         VALUES ($1, 'task_due', $2, $3, $4, $5, 'unread', NOW())
         ON CONFLICT (user_id, type, ref_id, ref_date) DO NOTHING`,
        [
          task.user_id,
          'Overdue Task',
          `"${task.title}" was due and is still incomplete.`,
          String(task.id),
          today,
        ]
      );

      // skip
      if (rowCount === 0) continue;

      //noti
      await sendToUser(task.user_id, {
        title: 'Overdue Task',
        body: `"${task.title}" was due and is still incomplete.`,
        type: 'task_due',
        url: '/tasks',
      });

      //email
      if (task.email && !isQuietHours(task.quiet_start, task.quiet_end)) {
        try {
          await sendOverdueTaskEmail({
            to: task.email,
            taskTitle: task.title,
            dueDate: task.due_date,
          });
        } catch (err) {
          console.error(`[OverdueEmail] Failed for task ${task.id}:`, err.message);
        }
      }
    }

    if (tasks.length > 0) {
      console.log(`[overdueTaskAlerts] Processed ${tasks.length} overdue tasks`);
    }
  } catch (err) {
    console.error('overdueTaskAlerts error:', err.message);
  }
}

module.exports = { runOverdueTaskAlerts };