const cron = require('node-cron');
const pool = require('../db');
const { sendToUser } = require('../services/notificationService');

function startReminderJobs() {
  cron.schedule('* * * * *', async () => {
    try {
      const { rows: tasks } = await pool.query(`
        SELECT t.id, t.title, t.user_id,
               np.lead_time_mins, np.task_reminders
        FROM tasks t
        JOIN notification_preferences np ON t.user_id = np.user_id
        WHERE np.task_reminders = true
          AND t.is_completed = false
          AND t.reminded = false
          AND t.due_date BETWEEN NOW() AND NOW() + (np.lead_time_mins || ' minutes')::INTERVAL
      `);

      for (const task of tasks) {
        await sendToUser(task.user_id, {
          title: 'Task Due Soon',
          body: `"${task.title}" is due soon!`,
          type: 'task_reminder',
          url: '/tasks'
        });
        await pool.query(
          'UPDATE tasks SET reminded = true WHERE id = $1', [task.id]
        );
      }
    } catch (err) {
      console.error('Task reminder job error:', err.message);
    }
  });

  // daily habit checkin nudge at 8am
  cron.schedule('0 8 * * *', async () => {
    try {
      const { rows: users } = await pool.query(`
        SELECT u.id FROM users u
        JOIN notification_preferences np ON u.id = np.user_id
        WHERE np.habit_checkins = true
      `);

      for (const user of users) {
        await sendToUser(user.id, {
          title: 'Daily Habit Check-in',
          body: "Don't forget to log your habits today!",
          type: 'habit_checkin',
          url: '/habits'
        });
      }
    } catch (err) {
      console.error('Habit checkin job error:', err.message);
    }
  });

  console.log('Reminder jobs test');
}

module.exports = { startReminderJobs };