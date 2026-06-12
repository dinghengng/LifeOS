// Importing all the tools we need for our server 
const express = require('express');
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const cors = require('cors');
const crypto = require("crypto");
const pool = require('./db');
require('dotenv').config();

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
        "http://localhost:3000",        // local Next.js
        process.env.FRONTEND_URL,       // Vercel URL, e.g. https://lifeos.vercel.app
      ].filter(Boolean); // remove undefined

      // Matches local development domains and any incoming wireless subnet pattern variations
      if (allowedOrigins.includes(origin) || origin.includes("192.168.1.") || origin.includes("192.168.")) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true, // Crucial: allows session cookies to pass through
  })
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
      [sessionId]
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

// REGISTER A NEW USER ACCOUNT
app.post("/auth/register", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name`,
      [email.toLowerCase().trim(), passwordHash, name || null]
    );
    const newUser = userResult.rows[0];

    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await pool.query(
      "INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)",
      [sessionId, newUser.id, expiresAt]
    );

    // Set cookie for web browsers
    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Mobile apps look inside the JSON response body payload directly for authentication parameters
    res.status(201).json({ id: newUser.id, email: newUser.email, name: newUser.name, token: sessionId });
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
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );

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
      [sessionId, user.id, expiresAt]
    );

    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    };

    if (rememberMe) {
      cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    }

    res.cookie("sessionId", sessionId, cookieOptions);

    // Hand back token property configuration targets explicitly to authenticate your Expo phone environments
    res.json({ id: user.id, email: user.email, name: user.name, token: sessionId });
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
      sameSite: "lax",
      secure: false,
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
app.get('/tasks', requireAuth, async (req, res) => {
  try {
    const allTasks = await pool.query(
      "SELECT * FROM tasks WHERE user_id = $1 ORDER BY id ASC",
      [req.user.id]
    );
    res.json(allTasks.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});


// CREATE A NEW TASK (POST REQUEST)
app.post('/tasks', requireAuth, async (req, res) => {
  try {
    const { title, dueDate, priority } = req.body;
    const safePriority = ["critical", "high", "low", "none"].includes(priority)
      ? priority
      : "none";

    const newTask = await pool.query(
      "INSERT INTO tasks (title, due_date, priority, user_id) VALUES($1, $2, $3, $4) RETURNING *",
      [title, dueDate || null, safePriority, req.user.id]
    );
    res.status(201).json(newTask.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});


// UPDATE TASK STATUS (PUT REQUEST)
app.put('/tasks/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isCompleted } = req.body;
    
    const updateTask = await pool.query(
      "UPDATE tasks SET is_completed = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
      [isCompleted, id, req.user.id]
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
app.patch('/tasks/:id', requireAuth, async (req, res) => {
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
      [title ?? null, dueDate ?? null, safePriority, id, req.user.id]
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
app.delete('/tasks/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, req.user.id]
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
app.get('/mood/tags', requireAuth, async (req, res) => {
  try {
    const systemTags = await pool.query(
      "SELECT id, name, 'system' AS type FROM tags ORDER BY name ASC"
    );
    const userTags = await pool.query(
      "SELECT id, name, 'custom' AS type FROM user_tags WHERE user_id = $1 ORDER BY name ASC",
      [req.user.id]
    );
    res.json({ system: systemTags.rows, custom: userTags.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Creates a custom "Other" tag
app.post('/mood/tags/custom', requireAuth, async (req, res) => {
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
      [req.user.id, name.trim().toLowerCase()]
    ); //return exisiting tag if name already in use

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Create mood log
// create mood entry with stress level and tags
app.post('/mood/logs', requireAuth, async (req, res) => {
  const { mood_level, stress_level, systemTagIds = [], customTagIds = [], loggedAt, note } = req.body;

  if (!mood_level || !stress_level) {
    return res.status(400).json({ error: "mood_level and stress_level are required" });
  }

  try {
    const logResult = await pool.query(
      `INSERT INTO mood_logs (user_id, mood_level, stress_level, logged_at, note)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, mood_level, stress_level, loggedAt || new Date().toISOString(), note || null]
    );
    const newLog = logResult.rows[0];

    for (const tagId of systemTagIds) {
      await pool.query(
        "INSERT INTO mood_log_tags (mood_log_id, tag_id) VALUES ($1, $2)",
        [newLog.id, tagId]
      );
    }
    for (const userTagId of customTagIds) {
      await pool.query(
        "INSERT INTO mood_log_tags (mood_log_id, user_tag_id) VALUES ($1, $2)",
        [newLog.id, userTagId]
      );
    }

    res.status(201).json({ ...newLog, tags: [] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.get('/mood/logs', requireAuth, async (req, res) => {
  try {
    const logsResult = await pool.query(
      `SELECT id, mood_level, stress_level, logged_at, created_at, note
       FROM mood_logs
       WHERE user_id = $1
       ORDER BY logged_at DESC`,
      [req.user.id]
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
      [logIds]
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
app.patch('/mood/logs/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { mood_level, stress_level, systemTagIds, customTagIds, loggedAt, note } = req.body;

  try {
    const existing = await pool.query(
      "SELECT id FROM mood_logs WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
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
      [mood_level ?? null, stress_level ?? null, loggedAt ?? null, note ?? null, id, req.user.id]
    );

    // Replace tags only if a new tag list was provided
    if (systemTagIds !== undefined || customTagIds !== undefined) {
      await pool.query("DELETE FROM mood_log_tags WHERE mood_log_id = $1", [id]);

      for (const tagId of systemTagIds || []) {
        await pool.query(
          "INSERT INTO mood_log_tags (mood_log_id, tag_id) VALUES ($1, $2)",
          [id, tagId]
        );
      }
      for (const userTagId of customTagIds || []) {
        await pool.query(
          "INSERT INTO mood_log_tags (mood_log_id, user_tag_id) VALUES ($1, $2)",
          [id, userTagId]
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
app.delete('/mood/logs/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM mood_logs WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, req.user.id]
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
app.get('/journal', requireAuth, async (req, res) => {
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
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Create journal entry
app.post('/journal', requireAuth, async (req, res) => {
  const { content, mood_log_id, prompt_used, title } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Content is required" });
  }

  try {
    if (mood_log_id) {
      const check = await pool.query(
        "SELECT id FROM mood_logs WHERE id = $1 AND user_id = $2",
        [mood_log_id, req.user.id]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ error: "Invalid mood log reference" });
      }
    }

    const result = await pool.query(
      `INSERT INTO journal_entries (user_id, mood_log_id, content, prompt_used, title)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, mood_log_id || null, content, prompt_used || null, title || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Edit journal entry
app.patch('/journal/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { content, mood_log_id, title } = req.body;

  try {
    const existing = await pool.query(
      "SELECT id FROM journal_entries WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    if (mood_log_id !== undefined) {
      const check = await pool.query(
        "SELECT id FROM mood_logs WHERE id = $1 AND user_id = $2",
        [mood_log_id, req.user.id]
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
      [content ?? null, mood_log_id ?? null, title ?? null, id, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Delete journal entry
app.delete('/journal/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM journal_entries WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, req.user.id]
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
app.get('/mood/emoji-packs', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, emojis, is_default FROM emoji_packs ORDER BY is_default DESC, id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET: user chosen mood pack
app.get('/mood/config', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, level, label, emoji, color, display_order
       FROM mood_levels
       WHERE user_id = $1
       ORDER BY display_order ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT: all the mood packs to choose from
app.put('/mood/config', requireAuth, async (req, res) => {
  const { levels } = req.body;

  if (!Array.isArray(levels) || levels.length !== 5) {
    return res.status(400).json({ error: 'Exactly 5 mood levels required' });
  }

  for (const l of levels) {
    if (![1, 2, 3, 4, 5].includes(l.level) || !l.label || !l.emoji || !l.color) {
      return res.status(400).json({ error: 'Invalid mood level data' });
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
        [req.user.id, l.level, l.label, l.emoji, l.color, l.display_order ?? l.level - 1]
      );
      saved.push(result.rows[0]);
    }
    saved.sort((a, b) => a.display_order - b.display_order);
    res.json(saved);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// Feature 3 (HABITS & GOALS)

app.get('/api/habits', requireAuth, async (req, res) => {
  try {
    const habitsResult = await pool.query(
      'SELECT id, name, icon, color, streak FROM habits WHERE user_id = $1 ORDER BY id ASC',
      [req.user.id]
    );
    const logsResult = await pool.query(
      `SELECT habit_id, completed_at::text FROM habit_logs 
       WHERE habit_id IN (SELECT id FROM habits WHERE user_id = $1)
       AND completed_at >= CURRENT_DATE - INTERVAL '6 days'`,
      [req.user.id]
    );

    const completionMap = {};
    logsResult.rows.forEach(log => {
      const dateStr = log.completed_at.split(' ')[0]; 
      if (!completionMap[log.habit_id]) {
        completionMap[log.habit_id] = new Set();
      }
      completionMap[log.habit_id].add(dateStr);
    });

    const habits = habitsResult.rows.map(habit => {
      const completedDays = [];
      const habitDatesSet = completionMap[habit.id] || new Set();

      for (let i = 6; i >= 0; i--) {
        // Generate local date strings matching current date
        const d = new Date();
        d.setDate(d.getDate() - i);
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        completedDays.push(habitDatesSet.has(dateStr));
      }

      return {
        id: String(habit.id),
        name: habit.name,
        icon: habit.icon,
        color: habit.color,
        streak: habit.streak,
        completedDays
      };
    });

    res.json(habits);
  } catch (err) {
    console.error("Fetch habits error:", err.message);
    res.status(500).send("Server Error");
  }
});

// TOGGLE completion status for id
app.post('/api/habits/:id/toggle', requireAuth, async (req, res) => {
  const habitId = req.params.id;
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    // Verify ownership of requested target habit parameter
    const verifyOwnership = await pool.query(
      'SELECT id FROM habits WHERE id = $1 AND user_id = $2',
      [habitId, req.user.id]
    );
    if (verifyOwnership.rows.length === 0) {
      return res.status(404).json({ error: "Habit configuration not found" });
    }

    const checkLog = await pool.query(
      'SELECT id FROM habit_logs WHERE habit_id = $1 AND completed_at = $2',
      [habitId, todayStr]
    );

    if (checkLog.rows.length > 0) {
      // Done then Untoggle (Delete the log entry and decrement streak value)
      await pool.query('DELETE FROM habit_logs WHERE habit_id = $1 AND completed_at = $2', [habitId, todayStr]);
      await pool.query('UPDATE habits SET streak = GREATEST(0, streak - 1) WHERE id = $1', [habitId]);
      res.json({ completed: false });
    } else {
      // Not done then Toggle (Insert log entry and increment streak value)
      await pool.query('INSERT INTO habit_logs (habit_id, completed_at) VALUES ($1, $2)', [habitId, todayStr]);
      await pool.query('UPDATE habits SET streak = streak + 1 WHERE id = $1', [habitId]);
      res.json({ completed: true });
    }
  } catch (err) {
    console.error("Toggle habit error:", err.message);
    res.status(500).send("Server Error");
  }
});

// fetch all goals with the checklists
app.get('/api/goals', requireAuth, async (req, res) => {
  try {
    const goalsResult = await pool.query(
      'SELECT id, title, category, color, progress, due_date AS "dueDate" FROM goals WHERE user_id = $1 ORDER BY id ASC',
      [req.user.id]
    );

    if (goalsResult.rows.length === 0) return res.json([]);

    const goalIds = goalsResult.rows.map(g => g.id);
    const milestonesResult = await pool.query(
      'SELECT id, goal_id, label, is_done AS done FROM goal_milestones WHERE goal_id = ANY($1) ORDER BY display_order ASC',
      [goalIds]
    );

    const milestonesMap = {};
    milestonesResult.rows.forEach(ms => {
      if (!milestonesMap[ms.goal_id]) {
        milestonesMap[ms.goal_id] = [];
      }
      milestonesMap[ms.goal_id].push({
        label: ms.label,
        done: ms.done
      });
    });

    const goals = goalsResult.rows.map(goal => ({
      id: String(goal.id),
      title: goal.title,
      category: goal.category,
      color: goal.color,
      progress: goal.progress,
      dueDate: goal.dueDate,
      milestones: milestonesMap[goal.id] || []
    }));

    res.json(goals);
  } catch (err) {
    console.error("Fetch goals error:", err.message);
    res.status(500).send("Server Error");
  }
});

// CREATE A NEW HABIT
app.post('/api/habits', requireAuth, async (req, res) => {
  const { name, icon, color } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  try {
    const result = await pool.query(
      `INSERT INTO habits (user_id, name, icon, color) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, icon, color, streak`,
      [req.user.id, name, icon || '🏃', color || '#1D9E75']
    );

    // Format to match frontend structure with empty 7 days array
    const newHabit = {
      ...result.rows[0],
      id: String(result.rows[0].id),
      completedDays: [false, false, false, false, false, false, false]
    };
    res.status(201).json(newHabit);
  } catch (err) {
    console.error("Create habit error:", err.message);
    res.status(500).send("Server Error");
  }
});

// CREATE A NEW GOAL
app.post('/api/goals', requireAuth, async (req, res) => {
  const { title, category, color, dueDate, milestones = [] } = req.body;
  if (!title || !dueDate) return res.status(400).json({ error: "Title and Due Date are required" });

  try {
    // Insert goal
    const goalResult = await pool.query(
      `INSERT INTO goals (user_id, title, category, color, progress, due_date) 
       VALUES ($1, $2, $3, $4, 0, $5) 
       RETURNING id, title, category, color, progress, due_date AS "dueDate"`,
      [req.user.id, title, category || 'General', color || '#534AB7', dueDate]
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
        [newGoal.id, milestones[i].trim(), i]
      );
      savedMilestones.push(msResult.rows[0]);
    }

    res.status(201).json({
      ...newGoal,
      id: String(newGoal.id),
      milestones: savedMilestones
    });
  } catch (err) {
    console.error("Create goal error:", err.message);
    res.status(500).send("Server Error");
  }
});

// toggle milestone done vs undone
app.patch('/api/goals/:goalId/milestones/:milestoneIndex', requireAuth, async (req, res) => {
  const { goalId, milestoneIndex } = req.params;

  try {
    // Verify ownership
    const verify = await pool.query(
      'SELECT id FROM goals WHERE id = $1 AND user_id = $2',
      [goalId, req.user.id]
    );
    if (verify.rows.length === 0) return res.status(404).json({ error: "Goal not found" });

    // then get the milestone
    const ms = await pool.query(
      'SELECT id, is_done FROM goal_milestones WHERE goal_id = $1 AND display_order = $2',
      [goalId, milestoneIndex]
    );
    if (ms.rows.length === 0) return res.status(404).json({ error: "Milestone not found" });

    const newDone = !ms.rows[0].is_done;
    await pool.query(
      'UPDATE goal_milestones SET is_done = $1 WHERE id = $2',
      [newDone, ms.rows[0].id]
    );

    // Recalculate progress from milestones
    const allMs = await pool.query(
      'SELECT is_done FROM goal_milestones WHERE goal_id = $1',
      [goalId]
    );
    const total = allMs.rows.length;
    const done = allMs.rows.filter(r => r.is_done).length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;

    await pool.query('UPDATE goals SET progress = $1 WHERE id = $2', [progress, goalId]);

    res.json({ done: newDone, progress });
  } catch (err) {
    console.error("Toggle milestone error:", err.message);
    res.status(500).send("Server Error");
  }
});

// TOGGLE A GOAL MILESTONE COMPLETED STATUS
app.patch('/api/goals/milestones/:id/toggle', requireAuth, async (req, res) => {
  const milestoneId = req.params.id;

  try {
    // Flip the 'is_done' boolean status for the milestone
    const milestoneResult = await pool.query(
      `UPDATE goal_milestones 
       SET is_done = NOT is_done 
       WHERE id = $1 
       RETURNING goal_id, is_done`,
      [milestoneId]
    );

    if (milestoneResult.rows.length === 0) {
      return res.status(404).json({ error: "Milestone not found" });
    }

    const { goal_id, is_done } = milestoneResult.rows[0];

    // Recalculate total progress percentage for this specific goal
    const statsResult = await pool.query(
      `SELECT 
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE is_done = TRUE) AS completed
       FROM goal_milestones 
       WHERE goal_id = $1`,
      [goal_id]
    );

    const { total, completed } = statsResult.rows[0];
    const newProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Update the goal progress column in the database
    await pool.query(
      'UPDATE goals SET progress = $1 WHERE id = $2',
      [newProgress, goal_id]
    );

    res.json({ id: milestoneId, goalId: String(goal_id), done: is_done, progress: newProgress });
  } catch (err) {
    console.error("Toggle milestone error:", err.message);
    res.status(500).send("Server Error");
  }
});

// For new nutrition section
// POST: LOG A NEW MEAL
app.post('/api/nutrition', requireAuth, async (req, res) => {
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
        parseInt(fats) || 0
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create meal log error:", err.message);
    res.status(500).send("Server Error");
  }
});

// GET: fetch todays meal logs
app.get('/api/nutrition', requireAuth, async (req, res) => {
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
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch nutrition logs error:", err.message);
    res.status(500).send("Server Error");
  }
});

// GET: FETCH SAVED MEALS (QUICK-ADD)
app.get('/api/nutrition/saved', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM saved_meals WHERE user_id = $1 ORDER BY meal_name ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch saved meals error:", err.message);
    res.status(500).send("Server Error");
  }
});

// POST: create saved meal for easier access
app.post('/api/nutrition/saved', requireAuth, async (req, res) => {
  const { mealName, mealType, calories, protein, carbs, fats } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO saved_meals (user_id, meal_name, meal_type, calories, protein, carbs, fats)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.id, mealName.trim(), mealType, 
        parseInt(calories) || 0, parseInt(protein) || 0, 
        parseInt(carbs) || 0, parseInt(fats) || 0
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create saved meal error:", err.message);
    res.status(500).send("Server Error");
  }
});

// GET: fetch user body metrics (for personalized recommendations and progress tracking)
app.get('/api/user/metrics', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT weight_kg, height_cm, fitness_goal FROM users WHERE id = $1`,
      [req.user.id]
    );
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error("Fetch metrics error:", err.message);
    res.status(500).send("Server Error");
  }
});

//post: update the user body metrics 
app.post('/api/user/metrics', requireAuth, async (req, res) => {
  const { weight_kg, height_cm, fitness_goal } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users 
       SET weight_kg = $1, height_cm = $2, fitness_goal = $3 
       WHERE id = $4 
       RETURNING weight_kg, height_cm, fitness_goal`,
      [weight_kg, height_cm, fitness_goal, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update metrics error:", err.message);
    res.status(500).send("Server Error");
  }
});

// edit under the quick add 
app.patch('/api/nutrition/saved/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { mealName, mealType, calories, protein, carbs, fats } = req.body;
  try {
    const result = await pool.query(
      `UPDATE saved_meals SET meal_name=$1, meal_type=$2, calories=$3, protein=$4, carbs=$5, fats=$6 
       WHERE id=$7 AND user_id=$8 RETURNING *`,
      [mealName, mealType, calories, protein, carbs, fats, id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).send("Server Error"); }
});

// delete under the quick add 
app.delete('/api/nutrition/saved/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM saved_meals WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ message: "Deleted successfully" });
  } catch (err) { res.status(500).send("Server Error"); }
});

// edit the meal logs
app.patch('/api/nutrition/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { mealName, mealType, calories, protein, carbs, fats } = req.body;
  try {
    const result = await pool.query(
      `UPDATE nutrition_logs SET meal_name=$1, meal_type=$2, calories=$3, protein=$4, carbs=$5, fats=$6 
       WHERE id=$7 AND user_id=$8 RETURNING *`,
      [mealName, mealType, calories, protein, carbs, fats, id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).send("Server Error"); }
});

// delete meal log entries
app.delete('/api/nutrition/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM meal_logs WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ message: "Deleted successfully" });
  } catch (err) { res.status(500).send("Server Error"); }
});

//Explicitly listen on local host '0.0.0.0' to receive outside network connections
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running natively and open to wireless network devices on port ${PORT}`);
});