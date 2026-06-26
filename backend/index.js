// Importing all the tools we need for our server
const express = require("express");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const crypto = require("crypto");
const pool = require("./db");
require("dotenv").config();
const { createNotificationRouter } = require("./routes/notifications");
const { startReminderJobs } = require("./jobs/reminderJob");

// Instantiating our application instance by calling the express function
const app = express();
// Setting our deployment port to check our .env file first, otherwise default to local port 5001
const PORT = process.env.PORT || 5001;
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (like curl, Postman, or native mobile networking engines)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:3000", // local Next.js
        process.env.FRONTEND_URL, // Vercel URL
      ].filter(Boolean); // remove undefined

      // TEMP DEBUG 
      console.log("CORS DEBUG incoming origin:", JSON.stringify(origin));
      console.log("CORS DEBUG FRONTEND_URL:", JSON.stringify(process.env.FRONTEND_URL));
      console.log("CORS DEBUG allowedOrigins:", JSON.stringify(allowedOrigins));
      console.log("CORS DEBUG exact match:", allowedOrigins.includes(origin));

      // Matches local development domains and any incoming wireless subnet pattern variations
      if (
        allowedOrigins.includes(origin) ||
        origin.includes("192.168.1.") ||
        origin.includes("192.168.")
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // Explicitly allow preflight
    allowedHeaders: ["Content-Type", "Authorization"], // Crucial: allows session cookies to pass through
  }),
);

// Hybrid Middleware: Checks browser cookies OR Mobile Authorization headers
const requireAuth = async (req, res, next) => {
  let sessionId = req.cookies?.sessionId;

  // Mobile fallback: Extract token from the Authorization header (e.g., "Bearer <token>")
  if (!sessionId && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      sessionId = parts[1];
    }
  }

  if (!sessionId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const result = await pool.query(
      `SELECT sessions.id AS session_id,
              sessions.expires_at,
              users.id,
              users.email,
              users.name
       FROM sessions
       JOIN users ON sessions.user_id = users.id
       WHERE sessions.id = $1
         AND sessions.expires_at > NOW()`,
      [sessionId],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Session expired or invalid" });
    }

    req.user = result.rows[0];
    req.currentSessionId = sessionId; // save session fallback reference context
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

app.use("/api/notifications", createNotificationRouter(requireAuth));

// REGISTER A NEW USER ACCOUNT
app.post("/auth/register", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      email.toLowerCase().trim(),
    ]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name`,
      [email.toLowerCase().trim(), passwordHash, name || null],
    );
    const newUser = userResult.rows[0];

    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await pool.query(
      "INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)",
      [sessionId, newUser.id, expiresAt],
    );

    // Set cookie for web browsers
    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Mobile apps look inside the JSON response body payload directly for authentication parameters
    res
      .status(201)
      .json({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        token: sessionId,
      });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// USER LOGIN
app.post("/auth/login", async (req, res) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase().trim(),
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await pool.query(
      "INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)",
      [sessionId, user.id, expiresAt],
    );

    const cookieOptions = {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    };

    if (rememberMe) {
      cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    }

    res.cookie("sessionId", sessionId, cookieOptions);

    // Hand back token property configuration targets explicitly to authenticate your Expo phone environments
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      token: sessionId,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// USER LOGOUT
app.post("/auth/logout", requireAuth, async (req, res) => {
  const sessionId = req.currentSessionId || req.cookies?.sessionId;

  try {
    await pool.query("DELETE FROM sessions WHERE id = $1", [sessionId]);

    res.clearCookie("sessionId", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    res.json({ message: "Logged out" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET CURRENT LOGGED-IN USER
app.get("/auth/me", requireAuth, async (req, res) => {
  res.json({ id: req.user.id, email: req.user.email, name: req.user.name });
});

// RETRIEVE ALL TASKS (GET REQUEST)
app.get("/tasks", requireAuth, async (req, res) => {
  try {
    const allTasks = await pool.query(
      "SELECT * FROM tasks WHERE user_id = $1 ORDER BY id ASC",
      [req.user.id],
    );
    res.json(allTasks.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// CREATE A NEW TASK (POST REQUEST)
app.post("/tasks", requireAuth, async (req, res) => {
  try {
    const { title, dueDate, priority } = req.body;
    const safePriority = ["critical", "high", "low", "none"].includes(priority)
      ? priority
      : "none";

    const newTask = await pool.query(
      "INSERT INTO tasks (title, due_date, priority, user_id) VALUES($1, $2, $3, $4) RETURNING *",
      [title, dueDate || null, safePriority, req.user.id],
    );
    res.status(201).json(newTask.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// UPDATE TASK STATUS (PUT REQUEST)
app.put("/tasks/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isCompleted } = req.body;

    const updateTask = await pool.query(
      "UPDATE tasks SET is_completed = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
      [isCompleted, id, req.user.id],
    );

    if (updateTask.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(updateTask.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// EDIT TASK DETAILS (PATCH REQUEST)
app.patch("/tasks/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, dueDate, priority } = req.body;

    const safePriority = ["critical", "high", "low", "none"].includes(priority)
      ? priority
      : "none";

    const updateTask = await pool.query(
      `
      UPDATE tasks
      SET 
        title = COALESCE($1, title),
        due_date = COALESCE($2, due_date),
        priority = COALESCE($3, priority)
      WHERE id = $4 AND user_id = $5
      RETURNING *
      `,
      [title ?? null, dueDate ?? null, safePriority, id, req.user.id],
    );

    if (updateTask.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(updateTask.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// PERMANENTLY ERASE A TASK (DELETE REQUEST)
app.delete("/tasks/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task was successfully deleted!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get mood tags (Start of feature 4:Journal)
// returns tags + user created tags
app.get("/mood/tags", requireAuth, async (req, res) => {
  try {
    const systemTags = await pool.query(
      "SELECT id, name, 'system' AS type FROM tags ORDER BY name ASC",
    );
    const userTags = await pool.query(
      "SELECT id, name, 'custom' AS type FROM user_tags WHERE user_id = $1 ORDER BY name ASC",
      [req.user.id],
    );
    res.json({ system: systemTags.rows, custom: userTags.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Creates a custom "Other" tag
app.post("/mood/tags/custom", requireAuth, async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Tag name is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO user_tags (user_id, name)
       VALUES ($1, $2)
       ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name, 'custom' AS type`,
      [req.user.id, name.trim().toLowerCase()],
    ); //return exisiting tag if name already in use

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// DELETE a custom tag
app.delete('/mood/tags/custom/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await pool.query(
      'SELECT id FROM user_tags WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Custom tag not found' });
    }

    await pool.query('DELETE FROM mood_log_tags WHERE user_tag_id = $1', [id]);

    await pool.query('DELETE FROM user_tags WHERE id = $1 AND user_id = $2', [
      id,
      req.user.id,
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error('Delete custom tag error:', err.message);
    res.status(500).json({ error: 'Failed to delete custom tag' });
  }
});

// Create mood log
// create mood entry with stress level and tags
app.post("/mood/logs", requireAuth, async (req, res) => {
  const {
    mood_level,
    stress_level,
    systemTagIds = [],
    customTagIds = [],
    loggedAt,
    note,
  } = req.body;

  if (!mood_level || !stress_level) {
    return res
      .status(400)
      .json({ error: "mood_level and stress_level are required" });
  }

  try {
    const logResult = await pool.query(
      `INSERT INTO mood_logs (user_id, mood_level, stress_level, logged_at, note)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        req.user.id,
        mood_level,
        stress_level,
        loggedAt || new Date().toISOString(),
        note || null,
      ],
    );
    const newLog = logResult.rows[0];

    for (const tagId of systemTagIds) {
      await pool.query(
        "INSERT INTO mood_log_tags (mood_log_id, tag_id) VALUES ($1, $2)",
        [newLog.id, tagId],
      );
    }
    for (const userTagId of customTagIds) {
      await pool.query(
        "INSERT INTO mood_log_tags (mood_log_id, user_tag_id) VALUES ($1, $2)",
        [newLog.id, userTagId],
      );
    }

    res.status(201).json({ ...newLog, tags: [] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.get("/mood/logs", requireAuth, async (req, res) => {
  try {
    const logsResult = await pool.query(
      `SELECT id, mood_level, stress_level, logged_at, created_at, note
       FROM mood_logs
       WHERE user_id = $1
       ORDER BY logged_at DESC`,
      [req.user.id],
    );

    if (logsResult.rows.length === 0) return res.json([]);

    const logIds = logsResult.rows.map((r) => r.id);
    const tagsResult = await pool.query(
      `SELECT
         mlt.mood_log_id,
         COALESCE(t.id, ut.id)     AS tag_id,
         COALESCE(t.name, ut.name) AS tag_name,
         CASE WHEN t.id IS NOT NULL THEN 'system' ELSE 'custom' END AS tag_type
       FROM mood_log_tags mlt
       LEFT JOIN tags t       ON mlt.tag_id = t.id
       LEFT JOIN user_tags ut ON mlt.user_tag_id = ut.id
       WHERE mlt.mood_log_id = ANY($1)`,
      [logIds],
    );

    const tagsByLog = {};
    for (const tag of tagsResult.rows) {
      if (!tagsByLog[tag.mood_log_id]) tagsByLog[tag.mood_log_id] = [];
      tagsByLog[tag.mood_log_id].push({
        id: tag.tag_id,
        name: tag.tag_name,
        type: tag.tag_type,
      });
    }

    const logs = logsResult.rows.map((log) => ({
      ...log,
      tags: tagsByLog[log.id] || [],
    }));
    res.json(logs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Edit mood log
// Updates mood level, stress level, tags, backfilled time
app.patch("/mood/logs/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const {
    mood_level,
    stress_level,
    systemTagIds,
    customTagIds,
    loggedAt,
    note,
  } = req.body;

  try {
    const existing = await pool.query(
      "SELECT id FROM mood_logs WHERE id = $1 AND user_id = $2",
      [id, req.user.id],
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Mood log not found" });
    }

    // Only update what was sent
    const updated = await pool.query(
      `UPDATE mood_logs
       SET
         mood_level   = COALESCE($1, mood_level),
         stress_level = COALESCE($2, stress_level),
         logged_at    = COALESCE($3, logged_at),
         note         = COALESCE($4, note)
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [
        mood_level ?? null,
        stress_level ?? null,
        loggedAt ?? null,
        note ?? null,
        id,
        req.user.id,
      ],
    );

    // Replace tags only if a new tag list was provided
    if (systemTagIds !== undefined || customTagIds !== undefined) {
      await pool.query("DELETE FROM mood_log_tags WHERE mood_log_id = $1", [
        id,
      ]);

      for (const tagId of systemTagIds || []) {
        await pool.query(
          "INSERT INTO mood_log_tags (mood_log_id, tag_id) VALUES ($1, $2)",
          [id, tagId],
        );
      }
      for (const userTagId of customTagIds || []) {
        await pool.query(
          "INSERT INTO mood_log_tags (mood_log_id, user_tag_id) VALUES ($1, $2)",
          [id, userTagId],
        );
      }
    }

    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Delete mood log
// Sets mood log to null
app.delete("/mood/logs/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM mood_logs WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Mood log not found" });
    }

    res.json({ message: "Mood log deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get journal entries
app.get("/journal", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         je.id,
         je.mood_log_id,
         je.content,
         je.prompt_used,
         je.title,
         je.created_at,
         je.updated_at,
         ml.mood_level,
         ml.stress_level,
         ml.logged_at AS mood_logged_at
       FROM journal_entries je
       LEFT JOIN mood_logs ml ON je.mood_log_id = ml.id
       WHERE je.user_id = $1
       ORDER BY je.created_at DESC`,
      [req.user.id],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Create journal entry
app.post("/journal", requireAuth, async (req, res) => {
  const { content, mood_log_id, prompt_used, title } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Content is required" });
  }

  try {
    if (mood_log_id) {
      const check = await pool.query(
        "SELECT id FROM mood_logs WHERE id = $1 AND user_id = $2",
        [mood_log_id, req.user.id],
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ error: "Invalid mood log reference" });
      }
    }

    const result = await pool.query(
      `INSERT INTO journal_entries (user_id, mood_log_id, content, prompt_used, title)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        req.user.id,
        mood_log_id || null,
        content,
        prompt_used || null,
        title || null,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Edit journal entry
app.patch("/journal/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { content, mood_log_id, title } = req.body;

  try {
    const existing = await pool.query(
      "SELECT id FROM journal_entries WHERE id = $1 AND user_id = $2",
      [id, req.user.id],
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    if (mood_log_id !== undefined) {
      const check = await pool.query(
        "SELECT id FROM mood_logs WHERE id = $1 AND user_id = $2",
        [mood_log_id, req.user.id],
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ error: "Invalid mood log reference" });
      }
    }

    const result = await pool.query(
      `UPDATE journal_entries
       SET
         content     = COALESCE($1, content),
         mood_log_id = CASE WHEN $2::int IS NOT NULL THEN $2::int ELSE mood_log_id END,
         title       = COALESCE($3, title),
         updated_at  = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [content ?? null, mood_log_id ?? null, title ?? null, id, req.user.id],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Delete journal entry
app.delete("/journal/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM journal_entries WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    res.json({ message: "Journal entry deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// GET: mood packs
app.get("/mood/emoji-packs", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, emojis, is_default FROM emoji_packs ORDER BY is_default DESC, id ASC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// GET: user chosen mood pack
app.get("/mood/config", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, level, label, emoji, color, display_order
       FROM mood_levels
       WHERE user_id = $1
       ORDER BY display_order ASC`,
      [req.user.id],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// PUT: all the mood packs to choose from
app.put("/mood/config", requireAuth, async (req, res) => {
  const { levels } = req.body;

  if (!Array.isArray(levels) || levels.length !== 5) {
    return res.status(400).json({ error: "Exactly 5 mood levels required" });
  }

  for (const l of levels) {
    if (
      ![1, 2, 3, 4, 5].includes(l.level) ||
      !l.label ||
      !l.emoji ||
      !l.color
    ) {
      return res.status(400).json({ error: "Invalid mood level data" });
    }
  }

  try {
    const saved = [];
    for (const l of levels) {
      const result = await pool.query(
        `INSERT INTO mood_levels (user_id, level, label, emoji, color, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, level)
         DO UPDATE SET
           label         = EXCLUDED.label,
           emoji         = EXCLUDED.emoji,
           color         = EXCLUDED.color,
           display_order = EXCLUDED.display_order
         RETURNING id, level, label, emoji, color, display_order`,
        [
          req.user.id,
          l.level,
          l.label,
          l.emoji,
          l.color,
          l.display_order ?? l.level - 1,
        ],
      );
      saved.push(result.rows[0]);
    }
    saved.sort((a, b) => a.display_order - b.display_order);
    res.json(saved);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.get("/api/habits", requireAuth, async (req, res) => {
  try {
    const habitsResult = await pool.query(
      "SELECT id, name, icon, color, category, streak, total_days FROM habits WHERE user_id = $1 ORDER BY id ASC",
      [req.user.id],
    );
    const logsResult = await pool.query(
      `SELECT habit_id, completed_at::text FROM habit_logs 
       WHERE habit_id IN (SELECT id FROM habits WHERE user_id = $1)
       AND completed_at >= date_trunc('week', CURRENT_DATE AT TIME ZONE 'Asia/Singapore') AT TIME ZONE 'Asia/Singapore'`,
      [req.user.id],
    );

    const completionMap = {};
    logsResult.rows.forEach((log) => {
      const dateStr = log.completed_at.split(" ")[0];
      if (!completionMap[log.habit_id]) {
        completionMap[log.habit_id] = new Set();
      }
      completionMap[log.habit_id].add(dateStr);
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
      const habitDatesSet = completionMap[habit.id] || new Set();

      // Build Mon(0) → Sun(6) for the current SGT week
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
        completedDays.push(habitDatesSet.has(dateStr));
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
      };
    });

    res.json(habits);
  } catch (err) {
    console.error("Fetch habits error:", err.message);
    res.status(500).send("Server Error");
  }
});

// TOGGLE completion status for id
app.post("/api/habits/:id/toggle", requireAuth, async (req, res) => {
  const habitId = req.params.id;
  const todayStr = new Date().toISOString().split("T")[0];

  try {
    // Verify ownership of requested target habit parameter
    const verifyOwnership = await pool.query(
      "SELECT id, streak, total_days FROM habits WHERE id = $1 AND user_id = $2",
      [habitId, req.user.id],
    );
    if (verifyOwnership.rows.length === 0) {
      return res.status(404).json({ error: "Habit configuration not found" });
    }
    const currentHabit = verifyOwnership.rows[0];

    const checkLog = await pool.query(
      "SELECT id FROM habit_logs WHERE habit_id = $1 AND completed_at = $2",
      [habitId, todayStr],
    );

    if (checkLog.rows.length > 0) {
      // Done then Untoggle (Delete the log entry, decrement streak, don't touch totalDays)
      await pool.query(
        "DELETE FROM habit_logs WHERE habit_id = $1 AND completed_at = $2",
        [habitId, todayStr],
      );
      // Recalculate totalDays from log count after deletion (source of truth)
      const totalDaysOff = await pool.query(
        "SELECT COUNT(*) AS total FROM habit_logs WHERE habit_id = $1",
        [habitId],
      );
      const newTotalDaysOff = parseInt(totalDaysOff.rows[0].total);
      const updatedOff = await pool.query(
        "UPDATE habits SET streak = GREATEST(0, streak - 1), total_days = $2 WHERE id = $1 RETURNING streak, total_days",
        [habitId, newTotalDaysOff],
      );
      res.json({
        completed: false,
        streak: updatedOff.rows[0].streak,
        totalDays: updatedOff.rows[0].total_days,
      });
    } else {
      // Not done then Toggle (Insert log entry, calculate new streak, increment totalDays only once)
      await pool.query(
        "INSERT INTO habit_logs (habit_id, completed_at) VALUES ($1, $2)",
        [habitId, todayStr],
      );

      // Get all logs for this habit to calculate proper streak
      const logsResult = await pool.query(
        `SELECT completed_at::text FROM habit_logs 
         WHERE habit_id = $1 
         ORDER BY completed_at DESC`,
        [habitId],
      );

      // Calculate streak: count consecutive days backwards from today (Diff logic from total days)
      let newStreak = 0;
      const today = new Date(todayStr);

      for (let i = 0; i < logsResult.rows.length; i++) {
        const logDate = new Date(logsResult.rows[i].completed_at.split(" ")[0]);
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - i);

        const logDateStr = logDate.toISOString().split("T")[0];
        const expectedDateStr = expectedDate.toISOString().split("T")[0];

        if (logDateStr === expectedDateStr) {
          newStreak++;
        } else {
          break;
        }
      }

      // Increment totalDays by counting all-time logs (source of truth, prevents drift)
      const totalDaysResult = await pool.query(
        "SELECT COUNT(*) AS total FROM habit_logs WHERE habit_id = $1",
        [habitId],
      );
      const newTotalDays = parseInt(totalDaysResult.rows[0].total);

      const updatedOn = await pool.query(
        "UPDATE habits SET streak = $1, total_days = $2 WHERE id = $3 RETURNING streak, total_days",
        [newStreak, newTotalDays, habitId],
      );
      res.json({
        completed: true,
        streak: updatedOn.rows[0].streak,
        totalDays: updatedOn.rows[0].total_days,
      });
    }
  } catch (err) {
    console.error("Toggle habit error:", err.message);
    res.status(500).send("Server Error");
  }
});

// fetch all goals with the checklists
app.get("/api/goals", requireAuth, async (req, res) => {
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

// CREATE A NEW HABIT
app.post("/api/habits", requireAuth, async (req, res) => {
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

// CREATE A NEW GOAL
app.post("/api/goals", requireAuth, async (req, res) => {
  const { title, category, color, dueDate, milestones = [] } = req.body;
  if (!title || !dueDate)
    return res.status(400).json({ error: "Title and Due Date are required" });
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
app.patch(
  "/api/goals/:goalId/milestones/:milestoneIndex",
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
      const newProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
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

// Edit habit
app.patch("/api/habits/:id", requireAuth, async (req, res) => {
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
app.delete("/api/habits/:id", requireAuth, async (req, res) => {
  const habitId = req.params.id;
  try {
    const verifyOwnership = await pool.query(
      "SELECT id FROM habits WHERE id = $1 AND user_id = $2",
      [habitId, req.user.id],
    );
    if (verifyOwnership.rows.length === 0) {
      return res.status(404).json({ error: "Habit configuration not found" });
    }
    // Remove associated logs first to satisfy foreign key constraints
    await pool.query("DELETE FROM habit_logs WHERE habit_id = $1", [habitId]);
    await pool.query("DELETE FROM habits WHERE id = $1", [habitId]);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete habit error:", err.message);
    res.status(500).send("Server Error");
  }
});

// Edit goal
app.patch("/api/goals/:id", requireAuth, async (req, res) => {
  const goalId = req.params.id;
  const { title, category, color, dueDate, milestones = [] } = req.body;
  if (!title || !dueDate)
    return res.status(400).json({ error: "Title and Due Date are required" });
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
app.delete("/api/goals/:id", requireAuth, async (req, res) => {
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

// For new nutrition section(Feature 4: Nutrition)
// POST: LOG A NEW MEAL
app.post("/api/nutrition", requireAuth, async (req, res) => {
  const { mealName, mealType, calories, protein, carbs, fats } = req.body;

  if (!mealName || !mealType) {
    return res.status(400).json({ error: "Meal name and type are required" });
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

// GET: fetch todays meal logs
app.get("/api/nutrition", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         id, 
         meal_name AS "mealName", 
         meal_type AS "mealType", 
         calories, 
         protein, 
         carbs, 
         fats, 
         created_at AS "createdAt"
       FROM meal_logs
       WHERE user_id = $1 
         AND created_at::date = CURRENT_DATE
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
app.get("/api/nutrition/saved", requireAuth, async (req, res) => {
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

// POST: create saved meal for easier access
app.post("/api/nutrition/saved", requireAuth, async (req, res) => {
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

// GET: fetch user body metrics (for personalized recommendations and progress tracking)
app.get("/api/user/metrics", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT weight_kg, height_cm, fitness_goal FROM users WHERE id = $1`,
      [req.user.id],
    );
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error("Fetch metrics error:", err.message);
    res.status(500).send("Server Error");
  }
});

//post: update the user body metrics
app.post("/api/user/metrics", requireAuth, async (req, res) => {
  const { weight_kg, height_cm, fitness_goal } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users 
       SET weight_kg = $1, height_cm = $2, fitness_goal = $3 
       WHERE id = $4 
       RETURNING weight_kg, height_cm, fitness_goal`,
      [weight_kg, height_cm, fitness_goal, req.user.id],
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update metrics error:", err.message);
    res.status(500).send("Server Error");
  }
});

// edit under the quick add
app.patch("/api/nutrition/saved/:id", requireAuth, async (req, res) => {
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

// delete under the quick add
app.delete("/api/nutrition/saved/:id", requireAuth, async (req, res) => {
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

// edit the meal logs
app.patch("/api/nutrition/:id", requireAuth, async (req, res) => {
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

// delete meal log entries
app.delete("/api/nutrition/:id", requireAuth, async (req, res) => {
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

// GET: fetch user supplements
app.get("/api/supplements", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM supplements WHERE user_id = $1 ORDER BY timing, name",
      [req.user.id],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch supplements error:", err.message);
    res.status(500).send("Server Error");
  }
});

//  POST: add a new supplement
app.post("/api/supplements", requireAuth, async (req, res) => {
  const { name, dose, timing } = req.body;
  if (!name || !dose || !timing) {
    return res
      .status(400)
      .json({ error: "Name, dose, and timing are required" });
  }
  try {
    const result = await pool.query(
      "INSERT INTO supplements (user_id, name, dose, timing) VALUES ($1, $2, $3, $4) RETURNING *",
      [req.user.id, name, dose, timing],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create supplement error:", err.message);
    res.status(500).send("Server Error");
  }
});

// DELETE /api/supplements/:id
app.delete("/api/supplements/:id", requireAuth, async (req, res) => {
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

// GET: fetch user XP
app.get("/api/user/xp", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT total_xp, awarded_quest_ids FROM user_xp WHERE user_id = $1",
      [req.user.id],
    );
    res.json(result.rows[0] ?? { total_xp: 0, awarded_quest_ids: [] });
  } catch (err) {
    console.error("Fetch XP error:", err.message);
    res.status(500).send("Server Error");
  }
});

//  POST: update user XP
app.post("/api/user/xp", requireAuth, async (req, res) => {
  const { total_xp, awarded_quest_ids } = req.body;
  if (total_xp === undefined || !awarded_quest_ids) {
    return res
      .status(400)
      .json({ error: "total_xp and awarded_quest_ids are required" });
  }
  try {
    const result = await pool.query(
      `INSERT INTO user_xp (user_id, total_xp, awarded_quest_ids)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
       SET total_xp = $2, awarded_quest_ids = $3
       RETURNING *`,
      [req.user.id, total_xp, awarded_quest_ids],
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update XP error:", err.message);
    res.status(500).send("Server Error");
  }
});

// for insights page
app.get("/api/nutrition/history", requireAuth, async (req, res) => {
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

    const filled = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      const sgtOffset = 8 * 60 * 60 * 1000;
      const sgtDate = new Date(d.getTime() + sgtOffset);
      sgtDate.setUTCDate(sgtDate.getUTCDate() - i);
      const dateStr = sgtDate.toISOString().split("T")[0];

      const row = result.rows.find((r) => {
        const rowDate =
          r.date instanceof Date
            ? r.date.toISOString().split("T")[0]
            : String(r.date);
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

//Explicitly listen on local host '0.0.0.0' to receive outside network connections
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Server is running natively and open to wireless network devices on port ${PORT}`,
  );
  startReminderJobs();
});
