const pool = require("../db");
const { sendToUser } = require("../services/notificationService");
const { composeWeeklyInsights } = require("../services/weeklyStats");
const { generateDigestNarration } = require("../services/groqClient");

// Fallback text used if the Groq call fails or GROQ_API_KEY is missing. 
function buildFallbackNarration(payload) {
  const parts = [];
  if (payload.habits) {
    parts.push(
      `You completed ${Math.round(payload.habits.overall_completion_rate * 100)}% of your habits this week` +
        (payload.habits.best_day
          ? `, with ${payload.habits.best_day} being your strongest day.`
          : "."),
    );
  }
  if (payload.mood) {
    parts.push(`Your average mood was ${payload.mood.avg_mood}/5 this week.`);
  }
  if (payload.goals) {
    parts.push(
      `You're averaging ${payload.goals.avg_progress}% progress across your active goals.`,
    );
  }
  return parts.join(" ") || "Here's your weekly check-in.";
}

async function runWeeklyDigest() {
  try {
    const { rows: users } = await pool.query(
      `SELECT id, name FROM users WHERE notifications_enabled = true`,
    );

    let sent = 0;
    for (const user of users) {
      const payload = await composeWeeklyInsights(user.id);
      if (!payload) continue; // nothing meaningful to report this week

      const narration =
        (await generateDigestNarration(payload)) ??
        buildFallbackNarration(payload);

      // ON CONFLICT DO NOTHING + RETURNING id: if this user already has a digest
      // for this week (job re-ran, manual retrigger, etc.), `inserted` is empty and
      // we skip notifying again — sendToUser has no built-in dedup, so this insert
      // is the only thing standing between us and spamming the user on every rerun.
      const { rows: inserted } = await pool.query(
        `INSERT INTO ai_insights (user_id, type, payload, narration, week_start)
         VALUES ($1, 'weekly_digest', $2, $3, $4)
         ON CONFLICT (user_id, type, week_start) DO NOTHING
         RETURNING id`,
        [user.id, JSON.stringify(payload), narration, payload.week_start],
      );
      if (inserted.length === 0) continue; // already generated + sent this week

      await sendToUser(user.id, {
        title: "Your Weekly Digest",
        body:
          narration.length > 100 ? narration.slice(0, 97) + "..." : narration,
        type: "weekly_digest",
        params: { narration },
        url: "/insights",
      });

      sent++;
    }

    console.log(
      `[weeklyDigest] Generated digests for ${sent}/${users.length} users`,
    );
  } catch (err) {
    console.error("weeklyDigest error:", err.message);
  }
}

module.exports = { runWeeklyDigest };
