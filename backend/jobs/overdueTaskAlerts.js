const pool = require('../db');
const { notifyInsert } = require('./notifyInsert');

async function runOverdueTaskAlerts() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { rows: tasks } = await pool.query(`
      SELECT id, title, user_id
      FROM tasks
      WHERE is_completed = false
        AND due_date IS NOT NULL
        AND due_date < NOW()
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
    }

    if (tasks.length > 0) {
      console.log(`[overdueTaskAlerts] Processed ${tasks.length} overdue tasks`);
    }
  } catch (err) {
    console.error('overdueTaskAlerts error:', err.message);
  }
}

module.exports = { runOverdueTaskAlerts };