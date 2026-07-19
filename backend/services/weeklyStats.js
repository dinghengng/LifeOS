const pool = require("../db");
const { getWeekBoundsSGT } = require("../utils/period");

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

//habit
async function getWeeklyHabitStats(userId, startDateStr, endDateStr) {
  const { rows: habits } = await pool.query(
    `SELECT id, name, streak, category FROM habits WHERE user_id = $1`,
    [userId],
  );
  if (habits.length === 0) return null;

  const { rows: logs } = await pool.query(
    `SELECT habit_id, completed_at::text AS date, status
     FROM habit_logs
     WHERE habit_id = ANY($1::int[])
       AND completed_at >= $2 AND completed_at < $3`,
    [habits.map((h) => h.id), startDateStr, endDateStr],
  );

  const byDayCount = {}; // day name -> { done, total }
  DAY_NAMES.forEach((d) => (byDayCount[d] = { done: 0, total: 0 }));

  let totalDone = 0;
  for (const log of logs) {
    const dayName = DAY_NAMES[new Date(log.date + "T00:00:00Z").getUTCDay()];
    byDayCount[dayName].total += 1;
    if (log.status === "done") {
      byDayCount[dayName].done += 1;
      totalDone += 1;
    }
  }

  const byDay = DAY_NAMES.map((day) => ({
    day,
    rate:
      byDayCount[day].total > 0
        ? Math.round((byDayCount[day].done / byDayCount[day].total) * 100) / 100
        : null,
  })).filter((d) => d.rate !== null);

  const bestDay = byDay.length ? byDay.reduce((a, b) => (b.rate > a.rate ? b : a)) : null;
  const worstDay = byDay.length ? byDay.reduce((a, b) => (b.rate < a.rate ? b : a)) : null;

  const topHabit = habits.reduce((a, b) => (b.streak > a.streak ? b : a), habits[0]);
  const possibleSlots = habits.length * 7;

  return {
    overall_completion_rate:
      possibleSlots > 0 ? Math.round((totalDone / possibleSlots) * 100) / 100 : 0,
    by_day: byDay,
    best_day: bestDay?.day ?? null,
    worst_day: worstDay?.day ?? null,
    top_habit: topHabit ? { name: topHabit.name, streak: topHabit.streak } : null,
    habit_count: habits.length,
  };
}

// Weekly mood/stress average, compared against the prior week for a simple trend read
async function getWeeklyMoodStats(userId, startDateStr, endDateStr, prevStartDateStr) {
  const { rows: current } = await pool.query(
    `SELECT mood_level, stress_level FROM mood_logs
     WHERE user_id = $1 AND logged_at >= $2 AND logged_at < $3`,
    [userId, startDateStr, endDateStr],
  );

  if (current.length === 0) return null;

  const { rows: previous } = await pool.query(
    `SELECT mood_level FROM mood_logs
     WHERE user_id = $1 AND logged_at >= $2 AND logged_at < $3`,
    [userId, prevStartDateStr, startDateStr],
  );

  const avg = (arr, key) => arr.reduce((s, r) => s + r[key], 0) / arr.length;
  const avgMood = Math.round(avg(current, "mood_level") * 10) / 10;
  const avgStress = Math.round(avg(current, "stress_level") * 10) / 10;
  const prevAvgMood = previous.length ? Math.round(avg(previous, "mood_level") * 10) / 10 : null;

  let trend = "flat";
  if (prevAvgMood !== null) {
    if (avgMood - prevAvgMood >= 0.3) trend = "improving";
    else if (prevAvgMood - avgMood >= 0.3) trend = "declining";
  }

  return {
    avg_mood: avgMood,
    avg_stress: avgStress,
    prev_week_avg_mood: prevAvgMood,
    trend,
    sample_size: current.length,
  };
}

// Active goals snapshot with nearest deadline + average progress
async function getGoalsSnapshot(userId) {
  const { rows: goals } = await pool.query(
    `SELECT title, progress, due_date FROM goals
     WHERE user_id = $1 AND progress < 100
     ORDER BY due_date ASC`,
    [userId],
  );
  if (goals.length === 0) return null;

  const avgProgress = Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length);

  return {
    active_count: goals.length,
    avg_progress: avgProgress,
    nearest_deadline: goals[0]
      ? { title: goals[0].title, due_date: goals[0].due_date, progress: goals[0].progress }
      : null,
  };
}

async function getTasksSnapshot(userId, startDateStr, endDateStr) {
  const { rows } = await pool.query(
    `SELECT is_completed, COUNT(*) AS count
     FROM tasks
     WHERE user_id = $1 AND due_date >= $2 AND due_date < $3
     GROUP BY is_completed`,
    [userId, startDateStr, endDateStr],
  );
  if (rows.length === 0) return null;

  const completed = rows.find((r) => r.is_completed)?.count ?? 0;
  const pending = rows.find((r) => !r.is_completed)?.count ?? 0;

  return {
    completed_this_week_approx: Number(completed),
    still_pending_due_this_week: Number(pending),
  };
}

async function getMoodHabitCorrelation(userId) {
  const { rows: moodRows } = await pool.query(
    `SELECT logged_at::date::text AS date, mood_level FROM mood_logs WHERE user_id = $1
     ORDER BY logged_at DESC LIMIT 60`,
    [userId],
  );
  if (moodRows.length < 14) return null;

  const { rows: habitLogRows } = await pool.query(
    `SELECT completed_at::text AS date, status FROM habit_logs
     WHERE habit_id IN (SELECT id FROM habits WHERE user_id = $1)
       AND completed_at >= $2::date - INTERVAL '60 days'`,
    [userId, moodRows[0].date],
  );

  const dailyCompletion = {}; // date -> {done, total}
  for (const log of habitLogRows) {
    if (!dailyCompletion[log.date]) dailyCompletion[log.date] = { done: 0, total: 0 };
    dailyCompletion[log.date].total += 1;
    if (log.status === "done") dailyCompletion[log.date].done += 1;
  }

  const pairs = [];
  for (const m of moodRows) {
    const d = dailyCompletion[m.date];
    if (d && d.total > 0) pairs.push({ mood: m.mood_level, rate: d.done / d.total });
  }
  if (pairs.length < 14) return null;

  const n = pairs.length;
  const meanMood = pairs.reduce((s, p) => s + p.mood, 0) / n;
  const meanRate = pairs.reduce((s, p) => s + p.rate, 0) / n;
  let num = 0,
    denomMood = 0,
    denomRate = 0;
  for (const p of pairs) {
    const dm = p.mood - meanMood;
    const dr = p.rate - meanRate;
    num += dm * dr;
    denomMood += dm * dm;
    denomRate += dr * dr;
  }
  const denom = Math.sqrt(denomMood * denomRate);
  if (denom === 0) return null;

  return { correlation: Math.round((num / denom) * 100) / 100, sample_size: n };
}

// Top journal themes this week, from Groq's per-entry analysis
async function getWeeklyJournalThemes(userId, startDateStr, endDateStr) {
  const { rows } = await pool.query(
    `SELECT theme, COUNT(*) AS count
     FROM journal_entries, jsonb_array_elements_text(ai_themes) AS theme
     WHERE user_id = $1
       AND ai_analyzed_at IS NOT NULL
       AND created_at >= $2 AND created_at < $3
     GROUP BY theme
     ORDER BY count DESC
     LIMIT 5`,
    [userId, startDateStr, endDateStr],
  );
  if (rows.length === 0) return null;

  return {
    top_themes: rows.map((r) => ({ theme: r.theme, count: Number(r.count) })),
  };
}

async function composeWeeklyInsights(userId) {
  const { startDateStr, endDateStr } = getWeekBoundsSGT();
  const prevWeekStart = new Date(startDateStr);
  prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 7);
  const prevStartDateStr = prevWeekStart.toISOString().split("T")[0];

  const [habits, mood, goals, tasks, correlation, journal] = await Promise.all([
    getWeeklyHabitStats(userId, startDateStr, endDateStr),
    getWeeklyMoodStats(userId, startDateStr, endDateStr, prevStartDateStr),
    getGoalsSnapshot(userId),
    getTasksSnapshot(userId, startDateStr, endDateStr),
    getMoodHabitCorrelation(userId),
    getWeeklyJournalThemes(userId, startDateStr, endDateStr),
  ]);

  // If there's nothing meaningful at all, just skip
  if (!habits && !mood && !goals && !tasks) return null;

  return {
    week_start: startDateStr,
    week_end: endDateStr,
    habits,
    mood,
    goals,
    tasks,
    mood_habit_correlation: correlation,
    journal,
  };
}

module.exports = { composeWeeklyInsights };