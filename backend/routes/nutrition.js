const express = require("express");
const pool = require("../db");

// Feature 4: Nutrition
function createNutritionRouter(requireAuth) {
  const router = express.Router();

  // POST: LOG A NEW MEAL
  router.post("/", requireAuth, async (req, res) => {
    const { mealName, mealType, calories, protein, carbs, fats } = req.body;

    if (!mealName || !mealType) {
      return res
        .status(400)
        .json({ error: "Meal name and type are required" });
    }

    try {
      const result = await pool.query(
        `INSERT INTO meal_logs (user_id, meal_name, meal_type, calories, protein, carbs, fats)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, meal_name AS "mealName", meal_type AS "mealType", calories, protein, carbs, fats, created_at AS "createdAt"`,
        [
          req.user.id,
          mealName.trim(),
          mealType,
          parseInt(calories) || 0,
          parseInt(protein) || 0,
          parseInt(carbs) || 0,
          parseInt(fats) || 0,
        ],
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Create meal log error:", err.message);
      res.status(500).send("Server Error");
    }
  });

  // GET: FETCH TODAY'S MEAL LOGS
  router.get("/", requireAuth, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT 
         id, 
         meal_name      AS "mealName", 
         meal_type      AS "mealType", 
         calories, 
         protein, 
         carbs, 
         fats, 
         created_at     AS "createdAt"
       FROM meal_logs
       WHERE user_id = $1 
         AND (created_at AT TIME ZONE 'Asia/Singapore')::date
             = (NOW() AT TIME ZONE 'Asia/Singapore')::date
       ORDER BY created_at ASC`,
        [req.user.id],
      );

      res.json(result.rows);
    } catch (err) {
      console.error("Fetch nutrition logs error:", err.message);
      res.status(500).send("Server Error");
    }
  });

  // GET: FETCH SAVED MEALS (QUICK-ADD)
  router.get("/saved", requireAuth, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM saved_meals WHERE user_id = $1 ORDER BY meal_name ASC`,
        [req.user.id],
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Fetch saved meals error:", err.message);
      res.status(500).send("Server Error");
    }
  });

  // POST: CREATE SAVED MEAL FOR QUICK-ADD
  router.post("/saved", requireAuth, async (req, res) => {
    const { mealName, mealType, calories, protein, carbs, fats } = req.body;
    try {
      const result = await pool.query(
        `INSERT INTO saved_meals (user_id, meal_name, meal_type, calories, protein, carbs, fats)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
        [
          req.user.id,
          mealName.trim(),
          mealType,
          parseInt(calories) || 0,
          parseInt(protein) || 0,
          parseInt(carbs) || 0,
          parseInt(fats) || 0,
        ],
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Create saved meal error:", err.message);
      res.status(500).send("Server Error");
    }
  });

  // PATCH: EDIT SAVED MEAL
  router.patch("/saved/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { mealName, mealType, calories, protein, carbs, fats } = req.body;
    try {
      const result = await pool.query(
        `UPDATE saved_meals SET meal_name=$1, meal_type=$2, calories=$3, protein=$4, carbs=$5, fats=$6 
       WHERE id=$7 AND user_id=$8 RETURNING *`,
        [mealName, mealType, calories, protein, carbs, fats, id, req.user.id],
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).send("Server Error");
    }
  });

  // DELETE: REMOVE SAVED MEAL
  router.delete("/saved/:id", requireAuth, async (req, res) => {
    try {
      await pool.query("DELETE FROM saved_meals WHERE id=$1 AND user_id=$2", [
        req.params.id,
        req.user.id,
      ]);
      res.json({ message: "Deleted successfully" });
    } catch (err) {
      res.status(500).send("Server Error");
    }
  });

  // GET: FETCH WEEKLY NUTRITION HISTORY (for insights/chart) fix for sgt alignment
  router.get("/history", requireAuth, async (req, res) => {
    const days = Math.min(parseInt(req.query.days) || 7, 30);
    try {
      const result = await pool.query(
        `SELECT
         (created_at AT TIME ZONE 'Asia/Singapore')::date AS date,
         SUM(calories)  AS calories,
         SUM(protein)   AS protein,
         SUM(carbs)     AS carbs,
         SUM(fats)      AS fats,
         COUNT(*)       AS meal_count
       FROM meal_logs
       WHERE user_id = $1
         AND (created_at AT TIME ZONE 'Asia/Singapore')::date 
             >= (NOW() AT TIME ZONE 'Asia/Singapore')::date - ($2 - 1) * INTERVAL '1 day'
       GROUP BY (created_at AT TIME ZONE 'Asia/Singapore')::date
       ORDER BY date ASC`,
        [req.user.id, days],
      );

      const SGT_OFFSET_MS = 8 * 60 * 60 * 1000;
      const filled = [];

      for (let i = days - 1; i >= 0; i--) {
        // Date.now() is always UTC milliseconds, safe on any server timezone
        const sgtNowMs = Date.now() + SGT_OFFSET_MS;
        const sgtDate = new Date(sgtNowMs);
        sgtDate.setUTCDate(sgtDate.getUTCDate() - i);
        const dateStr = sgtDate.toISOString().split("T")[0]; // "YYYY-MM-DD"

        const row = result.rows.find((r) => {
          const rowDate =
            r.date instanceof Date
              ? r.date.toISOString().split("T")[0]
              : String(r.date).split("T")[0]; // guard for "2025-06-27T00:00:00.000Z" strings
          return rowDate === dateStr;
        });

        filled.push({
          date: dateStr,
          calories: parseInt(row?.calories) || 0,
          protein: parseInt(row?.protein) || 0,
          carbs: parseInt(row?.carbs) || 0,
          fats: parseInt(row?.fats) || 0,
          meal_count: parseInt(row?.meal_count) || 0,
        });
      }

      res.json(filled);
    } catch (err) {
      console.error("History fetch error:", err.message);
      res.status(500).send("Server Error");
    }
  });

  // PATCH: EDIT MEAL LOG ENTRY
  router.patch("/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { mealName, mealType, calories, protein, carbs, fats } = req.body;
    try {
      const result = await pool.query(
        `UPDATE meal_logs SET meal_name=$1, meal_type=$2, calories=$3, protein=$4, carbs=$5, fats=$6 
       WHERE id=$7 AND user_id=$8 RETURNING *`,
        [mealName, mealType, calories, protein, carbs, fats, id, req.user.id],
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).send("Server Error");
    }
  });

  // DELETE: REMOVE MEAL LOG ENTRY
  router.delete("/:id", requireAuth, async (req, res) => {
    try {
      await pool.query("DELETE FROM meal_logs WHERE id=$1 AND user_id=$2", [
        req.params.id,
        req.user.id,
      ]);
      res.json({ message: "Deleted successfully" });
    } catch (err) {
      res.status(500).send("Server Error");
    }
  });

  return router;
}




// Helper: recompute streak by counting consecutive days backwards from today
// Identical pattern to the habits streak calc, logs are the only source of truth
async function computeStreak(suppId, todayStr) {
  const logsResult = await pool.query(
    `SELECT taken_at::text FROM supplement_logs
     WHERE supplement_id = $1
     ORDER BY taken_at DESC`,
    [suppId],
  );
  if (logsResult.rows.length === 0) return 0;

  const mostRecent = logsResult.rows[0].taken_at.split(" ")[0];

  const todayDate = new Date(todayStr + "T00:00:00Z");
  const yesterday = new Date(todayDate);
  yesterday.setUTCDate(todayDate.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // If the most recent log isn't today or yesterday, the streak is genuinely broken
  if (mostRecent !== todayStr && mostRecent !== yesterdayStr) return 0;
  // Anchor from the most recent log (today if taken, otherwise yesterday): this way untoggling today doesn't wipe out yesterday's still-valid streak
  const anchor = new Date(mostRecent + "T00:00:00Z");
  let streak = 0;
  for (let i = 0; i < logsResult.rows.length; i++) {
    const logDate = logsResult.rows[i].taken_at.split(" ")[0];
    const expected = new Date(anchor);
    expected.setUTCDate(anchor.getUTCDate() - i);
    const expectedStr = expected.toISOString().split("T")[0];

    if (logDate === expectedStr) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// Mounted at "/api/supplements" from index.js
function createSupplementsRouter(requireAuth) {
  const router = express.Router();

  // GET: FETCH USER SUPPLEMENTS
  router.get("/", requireAuth, async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM supplements WHERE user_id = $1 ORDER BY timing, name",
        [req.user.id],
      );
      const todayStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Singapore",
      }).format(new Date());

      const withStatus = await Promise.all(
        result.rows.map(async (s) => {
          const streak = await computeStreak(s.id, todayStr);
          const takenToday = await pool.query(
            "SELECT 1 FROM supplement_logs WHERE supplement_id = $1 AND taken_at = $2",
            [s.id, todayStr],
          );
          return { ...s, streak, takenToday: takenToday.rows.length > 0 };
        }),
      );
      res.json(withStatus);
    } catch (err) {
      console.error("Fetch supplements error:", err.message);
      res.status(500).send("Server Error");
    }
  });

  // POST: ADD A NEW SUPPLEMENT
  router.post("/", requireAuth, async (req, res) => {
    const { name, dose, timing, supplyCount, dailyDose, supplyUnit } =
      req.body;
    // dose is now optional
    if (!name || !timing) {
      return res.status(400).json({ error: "Name and timing are required" });
    }
    try {
      const result = await pool.query(
        `INSERT INTO supplements (user_id, name, dose, timing, supply_count, daily_dose, supply_unit)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          req.user.id,
          name,
          dose ?? null,
          timing,
          supplyCount ?? null,
          dailyDose ?? 1,
          supplyUnit ?? "pills",
        ],
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Create supplement error:", err.message);
      res.status(500).send("Server Error");
    }
  });

  // DELETE: REMOVE A SUPPLEMENT
  router.delete("/:id", requireAuth, async (req, res) => {
    try {
      const result = await pool.query(
        "DELETE FROM supplements WHERE id = $1 AND user_id = $2 RETURNING *",
        [req.params.id, req.user.id],
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Supplement not found" });
      }
      res.sendStatus(204);
    } catch (err) {
      console.error("Delete supplement error:", err.message);
      res.status(500).send("Server Error");
    }
  });

  // PATCH: UPDATE the supply count for supps (called from frontend when user edits supply manually)
  router.patch("/:id", requireAuth, async (req, res) => {
    const { supplyCount, dailyDose } = req.body;
    try {
      const result = await pool.query(
        `UPDATE supplements
       SET supply_count = COALESCE($1, supply_count),
           daily_dose   = COALESCE($2, daily_dose)
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
        [supplyCount ?? null, dailyDose ?? null, req.params.id, req.user.id],
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Supplement not found" });
      }
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Update supplement error:", err.message);
      res.status(500).send("Server Error");
    }
  });

  // POST: TOGGLE SUPPLEMENT TAKEN: mirrors habits toggle: log table is the source of truth
  router.post("/:id/toggle", requireAuth, async (req, res) => {
    const suppId = req.params.id;
    const todayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Singapore",
    }).format(new Date());

    try {
      const verifyOwnership = await pool.query(
        "SELECT id, supply_count, daily_dose FROM supplements WHERE id = $1 AND user_id = $2",
        [suppId, req.user.id],
      );
      if (verifyOwnership.rows.length === 0) {
        return res.status(404).json({ error: "Supplement not found" });
      }
      const supp = verifyOwnership.rows[0];

      const checkLog = await pool.query(
        "SELECT id FROM supplement_logs WHERE supplement_id = $1 AND taken_at = $2",
        [suppId, todayStr],
      );

      if (checkLog.rows.length > 0) {
        // Already taken today means untoggle: delete log, restore supply
        await pool.query(
          "DELETE FROM supplement_logs WHERE supplement_id = $1 AND taken_at = $2",
          [suppId, todayStr],
        );

        const newSupply =
          supp.supply_count !== null
            ? supp.supply_count + (supp.daily_dose ?? 1)
            : null;

        const updated = await pool.query(
          "UPDATE supplements SET supply_count = $2 WHERE id = $1 RETURNING *",
          [suppId, newSupply],
        );
        return res.json({
          ...updated.rows[0],
          streak: await computeStreak(suppId, todayStr),
        });
      }

      // Not taken today means toggle on: insert log, decrement supply
      await pool.query(
        "INSERT INTO supplement_logs (supplement_id, taken_at) VALUES ($1, $2)",
        [suppId, todayStr],
      );

      const newSupply =
        supp.supply_count !== null
          ? Math.max(0, supp.supply_count - (supp.daily_dose ?? 1))
          : null;

      const updated = await pool.query(
        "UPDATE supplements SET supply_count = $2 WHERE id = $1 RETURNING *",
        [suppId, newSupply],
      );
      res.json({
        ...updated.rows[0],
        streak: await computeStreak(suppId, todayStr),
      });
    } catch (err) {
      console.error("Toggle supplement error:", err.message);
      res.status(500).send("Server Error");
    }
  });

  return router;
}

module.exports = {
  createNutritionRouter,
  createSupplementsRouter,
  computeStreak,
};