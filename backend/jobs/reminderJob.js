const cron = require('node-cron');
const pool = require('../db');
const { sendToUser } = require('../services/notificationService');
const { sendTaskReminderEmail } = require('../services/emailService');
const { runOverdueTaskAlerts }     = require('./overdueTaskAlerts');
const { runGoalDeadlineAlerts }    = require('./goalDeadlineAlerts');
const { runHabitStreakRiskAlerts } = require('./habitStreakRiskAlerts');
const { runStreakMilestones }      = require('./streakMilestones');
const { runJournalNudge }          = require('./journalNudge');

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

        if (task.notifications_enabled && task.email) {
          try {
            await sendTaskReminderEmail({
              to: task.email,
              taskTitle: task.title,
              dueDate: task.due_date,
            });
          } catch (emailErr) {
            console.error(`[EmailReminder] Failed for task ${task.id}:`, emailErr.message);
          }
        }
        
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

  cron.schedule('0 * * * *',  runOverdueTaskAlerts); 
  cron.schedule('0 8 * * *',  runGoalDeadlineAlerts);    //8am
  cron.schedule('0 20 * * *', runHabitStreakRiskAlerts); //8pm
  cron.schedule('0 21 * * *', runStreakMilestones);      //9pm
  cron.schedule('0 22 * * *', runJournalNudge);          //10pm
}

module.exports = { startReminderJobs };