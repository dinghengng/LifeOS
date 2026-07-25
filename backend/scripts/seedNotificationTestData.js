require('dotenv').config();
const pool = require('../db');

const USER_ID = process.argv[2];
if (!USER_ID) { console.error('Usage: node seedNotificationTestData.js <userId>'); process.exit(1); }

(async () => {
  // Task due in 5 minutes
  await pool.query(
    `INSERT INTO tasks (user_id, title, due_date, is_completed, reminded)
     VALUES ($1, 'Test reminder task', NOW() + INTERVAL '5 minutes', false, false)`, [USER_ID]);

  // Overdue task
  await pool.query(
    `INSERT INTO tasks (user_id, title, due_date, is_completed)
     VALUES ($1, 'Test overdue task', NOW() - INTERVAL '1 day', false)`, [USER_ID]);

  // Habit with 3-day streak not done today
  await pool.query(
    `INSERT INTO habits (user_id, name, streak) VALUES ($1, 'Test Habit', 3)`, [USER_ID]);

  // Goal due in 3 days
  await pool.query(
    `INSERT INTO goals (user_id, title, category, due_date, progress)
     VALUES ($1, 'Test Goal', 'personal', CURRENT_DATE + INTERVAL '3 days', 50)`, [USER_ID]);

  console.log('Seed complete for user', USER_ID);
  process.exit(0);
})();