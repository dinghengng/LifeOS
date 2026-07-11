const express = require("express");
const pool = require("../db");

//Feature 3 Dashboard
function computeStreakFromLogs(logMap, todayStr) {
  let streak = 0;
  const cursor = new Date(todayStr + "T00:00:00Z");
  // Cap the walk so a habit with no gaps ever doesn't loop forever
  for (let i = 0; i < 3650; i++) {
    const dateStr = cursor.toISOString().split("T")[0];
    const status = logMap.get(dateStr);
    if (status === "done") {
      streak++;
    } else if (status === "skipped") {
      // rest day: don't increment streak but continue counting backwards
    } else {
      break;
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

function getSGTTodayStr() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
  }).format(new Date());
}

//GET HABITS 
function createHabitsRouter(requireAuth) {
  const router = express.Router();

  router.get("/", requireAuth, async (req, res) => {
    try {
      const habitsResult = await pool.query(
        "SELECT id, name, icon, color, category, streak, total_days FROM habits WHERE user_id = $1 ORDER BY id ASC",
        [req.user.id],
      );
      const logsResult = await pool.query(
        `SELECT habit_id, completed_at::text, status FROM habit_logs
       WHERE habit_id IN (SELECT id FROM habits WHERE user_id = $1)
       AND completed_at >= date_trunc('week', CURRENT_DATE AT TIME ZONE 'Asia/Singapore') AT TIME ZONE 'Asia/Singapore'`,
        [req.user.id],
      );

      const completionMap = {};
      logsResult.rows.forEach((log) => {
        const dateStr = log.completed_at.split(" ")[0];
        if (!completionMap[log.habit_id]) {
          completionMap[log.habit_id] = new Map();
        }
        completionMap[log.habit_id].set(dateStr, log.status);
      });

      // Determine current week's Monday in SGT
      const sgtDateStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Singapore",
      }).format(new Date());
      const sgtToday = new Date(sgtDateStr);
      const jsDayOfWeek = sgtToday.getDay(); // 0=Sun n 6=Sat
      const todayIndexMon = (jsDayOfWeek + 6) % 7; // 0=Mon n 6=Sun
      const monday = new Date(sgtToday);
      monday.setDate(sgtToday.getDate() - todayIndexMon);

      // Widen the log fetch window to cover full week (Mon to Sun)
      const habits = habitsResult.rows.map((habit) => {
        const completedDays = [];
        const skippedDays = [];
        const habitDatesSet = completionMap[habit.id] || new Map();

        // Build Mon(0) to Sun(6) for the current SGT week
        for (let i = 0; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
          const status = habitDatesSet.get(dateStr);
          completedDays.push(status === "done");
          skippedDays.push(status === "skipped");
        }

        return {
          id: String(habit.id),
          name: habit.name,
          icon: habit.icon,
          color: habit.color,
          category: habit.category,
          streak: habit.streak,
          totalDays: habit.total_days || 0,
          completedDays,
          skippedDays,
        };
      });

      res.json(habits);
    } catch (err) {
      console.error("Fetch habits error:", err.message);
      res.status(500).send("Server Error");
    }
  });

  // TOGGLE completion status for id
  router.post("/:id/toggle", requireAuth, async (req, res) => {
    const habitId = req.params.id;
    const todayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Singapore",
    }).format(new Date()); //chg to SGT

    try {
      const verifyOwnership = await pool.query(
        "SELECT id, streak, total_days FROM habits WHERE id = $1 AND user_id = $2",
        [habitId, req.user.id],
      );
      if (verifyOwnership.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Habit configuration not found" });
      }

      const checkLog = await pool.query(
        "SELECT id, status FROM habit_logs WHERE habit_id = $1 AND completed_at = $2",
        [habitId, todayStr],
      );
      if (checkLog.rows.length > 0 && checkLog.rows[0].status === "done") {
        // Done then Untoggle (Delete the log entry)
        await pool.query(
          "DELETE FROM habit_logs WHERE habit_id = $1 AND completed_at = $2",
          [habitId, todayStr],
        );
      } else if (
        checkLog.rows.length > 0 &&
        checkLog.rows[0].status === "skipped"
      ) {
        // Was skipped then mark as done
        await pool.query(
          "UPDATE habit_logs SET status = 'done' WHERE habit_id = $1 AND completed_at = $2",
          [habitId, todayStr],
        );
      } else {
        // Not done then Toggle
        await pool.query(
          "INSERT INTO habit_logs (habit_id, completed_at, status) VALUES ($1, $2, 'done')",
          [habitId, todayStr],
        );
      }

      // Get all logs for this habit to calculate proper streak
      const logsResult = await pool.query(
        `SELECT completed_at::text, status FROM habit_logs
   WHERE habit_id = $1`,
        [habitId],
      );

      const logMap = new Map(
        logsResult.rows.map((r) => [r.completed_at.split(" ")[0], r.status]),
      );

      const newStreak = computeStreakFromLogs(logMap, todayStr);

      const totalDaysResult = await pool.query(
        "SELECT COUNT(*) AS total FROM habit_logs WHERE habit_id = $1 AND status = 'done'",
        [habitId],
      );
      const newTotalDays = parseInt(totalDaysResult.rows[0].total);

      const updatedOn = await pool.query(
        "UPDATE habits SET streak = $1, total_days = $2 WHERE id = $3 RETURNING streak, total_days",
        [newStreak, newTotalDays, habitId],
      );
      res.json({
        completed: !(
          checkLog.rows.length > 0 && checkLog.rows[0].status === "done"
        ),
        streak: updatedOn.rows[0].streak,
        totalDays: updatedOn.rows[0].total_days,
      });
    } catch (err) {
      console.error("Toggle habit error:", err.message);
      res.status(500).send("Server Error");
    }
  });

  // TOGGLE rest-day (skip) status for id — mirrors /toggle but marks 'skipped' instead of 'done'
  router.post("/:id/skip", requireAuth, async (req, res) => {
    const habitId = req.params.id;
    const todayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Singapore",
    }).format(new Date()); //chg to SGT

    try {
      const verifyOwnership = await pool.query(
        "SELECT id, streak, total_days FROM habits WHERE id = $1 AND user_id = $2",
        [habitId, req.user.id],
      );
      if (verifyOwnership.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Habit configuration not found" });
      }

      const checkLog = await pool.query(
        "SELECT id, status FROM habit_logs WHERE habit_id = $1 AND completed_at = $2",
        [habitId, todayStr],
      );
      if (checkLog.rows.length > 0 && checkLog.rows[0].status === "skipped") {
        // Already skipped then Untoggle (Delete the log entry)
        await pool.query(
          "DELETE FROM habit_logs WHERE habit_id = $1 AND completed_at = $2",
          [habitId, todayStr],
        );
      } else if (
        checkLog.rows.length > 0 &&
        checkLog.rows[0].status === "done"
      ) {
        // Was done then mark as skipped (a rest day can't also be done)
        await pool.query(
          "UPDATE habit_logs SET status = 'skipped' WHERE habit_id = $1 AND completed_at = $2",
          [habitId, todayStr],
        );
      } else {
        // Not logged yet then mark as skipped
        await pool.query(
          "INSERT INTO habit_logs (habit_id, completed_at, status) VALUES ($1, $2, 'skipped')",
          [habitId, todayStr],
        );
      }

      // Get all logs for this habit to calculate proper streak
      const logsResult = await pool.query(
        `SELECT completed_at::text, status FROM habit_logs
   WHERE habit_id = $1`,
        [habitId],
      );

      const logMap = new Map(
        logsResult.rows.map((r) => [r.completed_at.split(" ")[0], r.status]),
      );

      const newStreak = computeStreakFromLogs(logMap, todayStr);

      const totalDaysResult = await pool.query(
        "SELECT COUNT(*) AS total FROM habit_logs WHERE habit_id = $1 AND status = 'done'",
        [habitId],
      );
      const newTotalDays = parseInt(totalDaysResult.rows[0].total);

      const updatedOn = await pool.query(
        "UPDATE habits SET streak = $1, total_days = $2 WHERE id = $3 RETURNING streak, total_days",
        [newStreak, newTotalDays, habitId],
      );
      res.json({
        skipped: !(
          checkLog.rows.length > 0 && checkLog.rows[0].status === "skipped"
        ),
        streak: updatedOn.rows[0].streak,
        totalDays: updatedOn.rows[0].total_days,
      });
    } catch (err) {
      console.error("Skip habit error:", err.message);
      res.status(500).send("Server Error");
    }
  });

// GET HISTORY (heatmap data) FOR A HABIT
router.get("/:id/history", requireAuth, async (req, res) => {
  const habitId = req.params.id;
  const days = Math.min(parseInt(req.query.days, 10) || 90, 365);

  try {
    const verifyOwnership = await pool.query(
      "SELECT id FROM habits WHERE id = $1 AND user_id = $2",
      [habitId, req.user.id],
    );
    if (verifyOwnership.rows.length === 0) {
      return res.status(404).json({ error: "Habit configuration not found" });
    }

    const logsResult = await pool.query(
      `SELECT completed_at::text, status FROM habit_logs
       WHERE habit_id = $1 AND completed_at >= (CURRENT_DATE - $2::int)
       ORDER BY completed_at ASC`,
      [habitId, days],
    );

    if (logsResult.rows.length === 0) {
      return res.json([]);
    }

    const logMap = new Map(
      logsResult.rows.map((r) => [r.completed_at.split(" ")[0], r.status]),
    );

    const todayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Singapore",
    }).format(new Date());

    // Backfill every day from the earliest log in range to today so
    // unlogged days show as "missed" instead of just disappearing.
    const earliestLogged = logsResult.rows[0].completed_at.split(" ")[0];
    const history = [];
    const cursor = new Date(`${earliestLogged}T00:00:00`);
    const end = new Date(`${todayStr}T00:00:00`);

    while (cursor <= end) {
      const dateStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Singapore",
      }).format(cursor);
      history.push({
        date: dateStr,
        status: logMap.get(dateStr) ?? "missed",
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    res.json(history);
  } catch (err) {
    console.error("Fetch habit history error:", err.message);
    res.status(500).send("Server Error");
  }
});

  // CREATE A NEW HABIT
  router.post("/", requireAuth, async (req, res) => {
    const { name, icon, color, category } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    try {
      const result = await pool.query(
        `INSERT INTO habits (user_id, name, icon, color, category, total_days) 
       VALUES ($1, $2, $3, $4, $5, 0) 
       RETURNING id, name, icon, color, category, streak, total_days`,
        [req.user.id, name, icon || "🏃", color || "#1D9E75", category || null],
      );

      // Format to match frontend structure with empty 7 days array
      const newHabit = {
        id: String(result.rows[0].id),
        name: result.rows[0].name,
        icon: result.rows[0].icon,
        color: result.rows[0].color,
        category: result.rows[0].category,
        streak: result.rows[0].streak,
        totalDays: result.rows[0].total_days || 0,
        completedDays: [false, false, false, false, false, false, false],
      };
      res.status(201).json(newHabit);
    } catch (err) {
      console.error("Create habit error:", err.message);
      res.status(500).send("Server Error");
    }
  });

  // Edit habit
  router.patch("/:id", requireAuth, async (req, res) => {
    const habitId = req.params.id;
    const { name, icon, color, category } = req.body;

    if (!name) return res.status(400).json({ error: "Name is required" });

    try {
      const result = await pool.query(
        `UPDATE habits 
       SET name = $1, icon = $2, color = $3, category = $4 
       WHERE id = $5 AND user_id = $6
       RETURNING id, name, icon, color, category, streak, total_days`,
        [
          name,
          icon || "🏃",
          color || "#1D9E75",
          category || null,
          habitId,
          req.user.id,
        ],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Habit not found" });
      }

      res.json({
        id: String(result.rows[0].id),
        name: result.rows[0].name,
        icon: result.rows[0].icon,
        color: result.rows[0].color,
        category: result.rows[0].category,
        streak: result.rows[0].streak,
        totalDays: result.rows[0].total_days || 0,
      });
    } catch (err) {
      console.error("Update habit error:", err.message);
      res.status(500).send("Server Error");
    }
  });

  // delete habit
  router.delete("/:id", requireAuth, async (req, res) => {
    const habitId = req.params.id;
    try {
      const verifyOwnership = await pool.query(
        "SELECT id FROM habits WHERE id = $1 AND user_id = $2",
        [habitId, req.user.id],
      );
      if (verifyOwnership.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Habit configuration not found" });
      }
      // Remove associated logs first to satisfy foreign key constraints
      await pool.query("DELETE FROM habit_logs WHERE habit_id = $1", [
        habitId,
      ]);
      await pool.query("DELETE FROM habits WHERE id = $1", [habitId]);
      res.json({ success: true });
    } catch (err) {
      console.error("Delete habit error:", err.message);
      res.status(500).send("Server Error");
    }
  });

  return router;
}
function createGoalsRouter(requireAuth) {
  const router = express.Router();

  // fetch all goals with the checklists
  router.get("/", requireAuth, async (req, res) => {
    try {
      const goalsResult = await pool.query(
        'SELECT id, title, category, color, progress, due_date AS "dueDate" FROM goals WHERE user_id = $1 ORDER BY id ASC',
        [req.user.id],
      );

      if (goalsResult.rows.length === 0) return res.json([]);

      const goalIds = goalsResult.rows.map((g) => g.id);
      const milestonesResult = await pool.query(
        "SELECT id, goal_id, label, is_done AS done FROM goal_milestones WHERE goal_id = ANY($1) ORDER BY display_order ASC",
        [goalIds],
      );

      const milestonesMap = {};
      milestonesResult.rows.forEach((ms) => {
        if (!milestonesMap[ms.goal_id]) {
          milestonesMap[ms.goal_id] = [];
        }
        milestonesMap[ms.goal_id].push({
          label: ms.label,
          done: ms.done,
        });
      });

      const goals = goalsResult.rows.map((goal) => ({
        id: String(goal.id),
        title: goal.title,
        category: goal.category,
        color: goal.color,
        progress: goal.progress,
        dueDate: goal.dueDate,
        milestones: milestonesMap[goal.id] || [],
      }));

      res.json(goals);
    } catch (err) {
      console.error("Fetch goals error:", err.message);
      res.status(500).send("Server Error");
    }
  });

  // CREATE A NEW GOAL
  router.post("/", requireAuth, async (req, res) => {
    const { title, category, color, dueDate, milestones = [] } = req.body;
    if (!title || !dueDate)
      return res
        .status(400)
        .json({ error: "Title and Due Date are required" });
    try {
      // Insert goal
      const goalResult = await pool.query(
        `INSERT INTO goals (user_id, title, category, color, progress, due_date) 
       VALUES ($1, $2, $3, $4, 0, $5) 
       RETURNING id, title, category, color, progress, due_date AS "dueDate"`,
        [req.user.id, title, category || "General", color || "#534AB7", dueDate],
      );
      const newGoal = goalResult.rows[0];

      // Insert milestones if provided
      const savedMilestones = [];
      for (let i = 0; i < milestones.length; i++) {
        if (!milestones[i].trim()) continue;
        const msResult = await pool.query(
          `INSERT INTO goal_milestones (goal_id, label, is_done, display_order) 
         VALUES ($1, $2, FALSE, $3) 
         RETURNING label, is_done AS done`,
          [newGoal.id, milestones[i].trim(), i],
        );
        savedMilestones.push(msResult.rows[0]);
      }

      res.status(201).json({
        ...newGoal,
        id: String(newGoal.id),
        milestones: savedMilestones,
      });
    } catch (err) {
      console.error("Create goal error:", err.message);
      res.status(500).send("Server Error");
    }
  });

  // Optimized & Secure: Toggle Goal Milestone by Index
  router.patch(
    "/:goalId/milestones/:milestoneIndex",
    requireAuth,
    async (req, res) => {
      const { goalId, milestoneIndex } = req.params;
      try {
        const milestoneResult = await pool.query(
          `UPDATE goal_milestones 
       SET is_done = NOT is_done 
       FROM goals
       WHERE goal_milestones.goal_id = $1 
         AND goal_milestones.display_order = $2
         AND goal_milestones.goal_id = goals.id 
         AND goals.user_id = $3
       RETURNING goal_milestones.goal_id, goal_milestones.is_done`,
          [goalId, milestoneIndex, req.user.id],
        );

        if (milestoneResult.rows.length === 0) {
          return res
            .status(404)
            .json({ error: "Milestone not found or unauthorized" });
        }

        const { goal_id, is_done } = milestoneResult.rows[0];
        const statsResult = await pool.query(
          `SELECT 
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE is_done = TRUE) AS completed
       FROM goal_milestones 
       WHERE goal_id = $1`,
          [goal_id],
        );
        const { total, completed } = statsResult.rows[0];
        const newProgress =
          total > 0 ? Math.round((completed / total) * 100) : 0;
        await pool.query("UPDATE goals SET progress = $1 WHERE id = $2", [
          newProgress,
          goal_id,
        ]);

        res.json({
          goalId: String(goal_id),
          index: milestoneIndex,
          done: is_done,
          progress: newProgress,
        });
      } catch (err) {
        console.error("Toggle milestone error:", err.message);
        res.status(500).send("Server Error");
      }
    },
  );

  // Edit goal
  router.patch("/:id", requireAuth, async (req, res) => {
    const goalId = req.params.id;
    const { title, category, color, dueDate, milestones = [] } = req.body;
    if (!title || !dueDate)
      return res
        .status(400)
        .json({ error: "Title and Due Date are required" });
    try {
      // Verify ownership
      const verify = await pool.query(
        "SELECT id FROM goals WHERE id = $1 AND user_id = $2",
        [goalId, req.user.id],
      );
      if (verify.rows.length === 0)
        return res.status(404).json({ error: "Goal not found" });
      // Update goal core fields
      const goalResult = await pool.query(
        `UPDATE goals 
       SET title = $1, category = $2, color = $3, due_date = $4 
       WHERE id = $5 
       RETURNING id, title, category, color, progress, due_date AS "dueDate"`,
        [title, category || "General", color || "#534AB7", dueDate, goalId],
      );
      const updatedGoal = goalResult.rows[0];
      // Fetch existing milestones so completed checkboxes survive an edit
      const existingMs = await pool.query(
        "SELECT label, is_done FROM goal_milestones WHERE goal_id = $1",
        [goalId],
      );
      const existingDoneMap = {};
      existingMs.rows.forEach((ms) => {
        existingDoneMap[ms.label] = ms.is_done;
      });
      await pool.query("DELETE FROM goal_milestones WHERE goal_id = $1", [
        goalId,
      ]);
      const savedMilestones = [];
      for (let i = 0; i < milestones.length; i++) {
        const label = milestones[i].trim();
        if (!label) continue;
        const isDone = existingDoneMap[label] || false;
        const msResult = await pool.query(
          `INSERT INTO goal_milestones (goal_id, label, is_done, display_order) 
         VALUES ($1, $2, $3, $4) 
         RETURNING label, is_done AS done`,
          [goalId, label, isDone, i],
        );
        savedMilestones.push(msResult.rows[0]);
      }

      // Recalculate progress from the new checklist
      const total = savedMilestones.length;
      const done = savedMilestones.filter((m) => m.done).length;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;
      await pool.query("UPDATE goals SET progress = $1 WHERE id = $2", [
        progress,
        goalId,
      ]);

      res.json({
        ...updatedGoal,
        id: String(updatedGoal.id),
        progress,
        milestones: savedMilestones,
      });
    } catch (err) {
      console.error("Update goal error:", err.message);
      res.status(500).send("Server Error");
    }
  });

  // DELETE A GOAL
  router.delete("/:id", requireAuth, async (req, res) => {
    const goalId = req.params.id;

    try {
      // Verify ownership
      const verify = await pool.query(
        "SELECT id FROM goals WHERE id = $1 AND user_id = $2",
        [goalId, req.user.id],
      );
      if (verify.rows.length === 0)
        return res.status(404).json({ error: "Goal not found" });

      // Remove associated milestones first to satisfy foreign key constraints
      await pool.query("DELETE FROM goal_milestones WHERE goal_id = $1", [
        goalId,
      ]);
      await pool.query("DELETE FROM goals WHERE id = $1", [goalId]);

      res.json({ success: true });
    } catch (err) {
      console.error("Delete goal error:", err.message);
      res.status(500).send("Server Error");
    }
  });

  return router;
}

module.exports = {
  createHabitsRouter,
  createGoalsRouter,
  computeStreakFromLogs,
  getSGTTodayStr,
};