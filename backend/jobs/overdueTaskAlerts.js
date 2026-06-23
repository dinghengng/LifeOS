const pool = require('../db');
const { notifyInsert } = require('./notifyInsert');
const { sendTaskReminderEmail } = require('../services/emailService');
const { isQuietHours } = require('./reminderJob');

async function runOverdueTaskAlerts() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { rows: tasks } = await pool.query(`
      SELECT t.id, t.title, t.user_id, u.email, np.quiet_start, np.quiet_end
      FROM tasks t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN notification_preferences np ON t.user_id = np.user_id
      WHERE t.is_completed = false
        AND t.due_date IS NOT NULL
        AND t.due_date < NOW()
        AND COALESCE(np.overdue_tasks, true) = true
    `);

    for (const task of tasks) {
      await notifyInsert(
        task.user_id,
        'task_due',
        'Overdue Task',
        `"${task.title}" was due and is still incomplete.`,
        task.id,
        today
      );

      if (task.email && !isQuietHours(task.quiet_start, task.quiet_end)) {
        try {
          await sendTaskReminderEmail({
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