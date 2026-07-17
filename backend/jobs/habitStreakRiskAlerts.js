const pool = require('../db');
const { notifyInsert } = require('./notifyInsert');
const { sendStreakRiskEmail } = require('../services/emailService');
const { isQuietHours } = require('./quietHours');

async function runHabitStreakRiskAlerts() {
  try {
    const today = new Date().toISOString().split('T')[0];

    //find habit streaks not done today
    const { rows: habits } = await pool.query(`
      SELECT h.id, h.name, h.user_id, h.streak, u.email, np.quiet_start, np.quiet_end
      FROM habits h
      JOIN users u ON u.id = h.user_id
      LEFT JOIN notification_preferences np ON h.user_id = np.user_id
      WHERE h.streak >= 3
        AND COALESCE(np.streak_risk, true) = true
        AND NOT EXISTS (
          SELECT 1 FROM habit_logs hl
          WHERE hl.habit_id = h.id
            AND hl.completed_at::date = CURRENT_DATE
        )
    `);

    for (const habit of habits) {
      await notifyInsert(
        habit.user_id,
        'habit_miss',
        { habitName: habit.name, streak: habit.streak },
        habit.id,
        today
      );

      if (habit.email && !isQuietHours(habit.quiet_start, habit.quiet_end)) {
        try {
          await sendStreakRiskEmail({
            to: habit.email,
            habitName: habit.name,
            streak: habit.streak,
          });
        } catch (err) {
          console.error(`[StreakRiskEmail] Failed for habit ${habit.id}:`, err.message);
        }
      }
    }

    if (habits.length > 0) {
      console.log(`[habitStreakRiskAlerts] Warned ${habits.length} habits at risk`);
    }
  } catch (err) {
    console.error('habitStreakRiskAlerts error:', err.message);
  }
}

module.exports = { runHabitStreakRiskAlerts };