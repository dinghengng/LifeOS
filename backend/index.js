//Importing all the tools we need for our server 
const express = require('express');
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const cors = require('cors');
const crypto = require("crypto");
const pool = require('./db'); 
require('dotenv').config();


// Instantiating our application instance by calling the express function
const app = express();
//Setting our deployment port to check our .env file first, otherwise default to local port 5001
const PORT = process.env.PORT || 5001;
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (like curl, Postman)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:3000",        // local Next.js
        process.env.FRONTEND_URL,       // Vercel URL, e.g. https://lifeos.vercel.app
      ].filter(Boolean); // remove undefined

      if (allowedOrigins.includes(origin) || origin.includes("192.168.1.")) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true, // Crucial: allows session cookies to pass through
  })
);

//Add this middleware to any route that requires the user to be logged in
const requireAuth = async (req, res, next) => {
  const sessionId = req.cookies?.sessionId;

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
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// REGISTER A NEW USER ACCOUNT
app.post("/auth/register", async (req, res) => {
  const { email, password, name } = req.body;

  //validation to avoid empty credentials and minimum password length for brute force attacks
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    //check if email is already taken
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already in use" });
    }

    //hash password
    const passwordHash = await bcrypt.hash(password, 10);

    //adding the new user
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name`,
      [email.toLowerCase().trim(), passwordHash, name || null]
    );
    const newUser = userResult.rows[0];

    //auto login set to expire in 7 days
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); //7 days

    await pool.query(
      "INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)",
      [sessionId, newUser.id, expiresAt]
    );

    //creating cookie
    res.cookie("sessionId", sessionId, {
  httpOnly: true,
  sameSite: "none",  // needed for cross-origin cookies
  secure: true,      // required when sameSite is "none"
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

    res.status(201).json({ id: newUser.id, email: newUser.email, name: newUser.name });
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

    //if email doesnt exist
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    //check password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); //7 days

    await pool.query(
      "INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)",
      [sessionId, user.id, expiresAt]
    );

    const cookieOptions = {
  httpOnly: true,
  sameSite: "none", // needed for cross-origin cookies
  secure: true,     // required when sameSite is "none"
};

    //remember me function
    if (rememberMe) {
      cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000; //7 days
    }

    res.cookie("sessionId", sessionId, cookieOptions);

    res.json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// USER LOGOUT
app.post("/auth/logout", requireAuth, async (req, res) => {
  const sessionId = req.cookies?.sessionId;

  try {
    await pool.query("DELETE FROM sessions WHERE id = $1", [sessionId]);

    //remove cookie
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
// Triggers when the client accesses http://localhost:5001/tasks
app.get('/tasks', requireAuth, async (req, res) => {
  try {
    const allTasks = await pool.query(
      "SELECT * FROM tasks WHERE user_id = $1 ORDER BY id ASC",
      [req.user.id]
    );
    // Hand back the raw array of table row data to the frontend in standard JSON format
    res.json(allTasks.rows);
  } catch (err) {
    // Print out any unexpected errors 
    console.error(err.message);
    // Alert the frontend application that an internal database connection breakdown occurred
    res.status(500).send("Server Error");
  }
});


// CREATE A NEW TASK (POST REQUEST)
// Triggers when the client pushes new entry details to local host for tasks 
app.post('/tasks', requireAuth, async (req, res) => {
  try {
    const { title, dueDate, priority } = req.body;
    const safePriority = ["critical", "high", "low", "none"].includes(priority)
      ? priority
      : "none";

    // insert the dynamic title variable into our database, linked to this user
    const newTask = await pool.query(
      "INSERT INTO tasks (title, due_date, priority, user_id) VALUES($1, $2, $3, $4) RETURNING *",
      [title, dueDate || null, safePriority, req.user.id] // allow empty deadlines
    );
    // Return the newly spawned table row record directly back to our active client interface
    res.status(201).json(newTask.rows[0]);
  } catch (err) {
    // Handle failures gracefully by outputting error details and returning server error code 500
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});


// UPDATE TASK STATUS (PUT REQUEST)
// Triggers when the client toggles completion at http://localhost:5001/tasks/:id
app.put('/tasks/:id', requireAuth, async (req, res) => {
  try {
    // Extract the variable route parameter target string (:id) out from the request URL path context
    const { id } = req.params;
    
    // Extract the updated boolean completion property sent inside our request payload body
    const { isCompleted } = req.body;
    
    // Execute a SQL transaction mapping our parameters to safely modify task status based on ID + user matching
    const updateTask = await pool.query(
      "UPDATE tasks SET is_completed = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
      [isCompleted, id, req.user.id]
    );
    
    if (updateTask.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Pass back the freshly modified task row structure data to confirm structural storage changes
    res.json(updateTask.rows[0]);
  } catch (err) {
    // Handle exceptions by logging terminal details and issuing a standard 500 network response
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});


// EDIT TASK DETAILS (PATCH REQUEST)
// Allows updating title, due date, and priority for a task
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
// Triggers when the client strikes out a line item using http://localhost:5001/tasks/:id
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
    // Catch database error 
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get mood tags
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

// Create mood log
// create mood entry with stress level and tags
app.post('/mood/logs', requireAuth, async (req, res) => {
  const { mood_level, stress_level, systemTagIds = [], customTagIds = [], loggedAt } = req.body;

  if (!mood_level || !stress_level) {
    return res.status(400).json({ error: "mood_level and stress_level are required" });
  }

  try {
    const logResult = await pool.query(
      `INSERT INTO mood_logs (user_id, mood_level, stress_level, logged_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, mood_level, stress_level, loggedAt || new Date().toISOString()]
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
      `SELECT id, mood_level, stress_level, logged_at, created_at
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
  const { mood_level, stress_level, systemTagIds, customTagIds, loggedAt } = req.body;

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
         logged_at    = COALESCE($3, logged_at)
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [mood_level ?? null, stress_level ?? null, loggedAt ?? null, id, req.user.id]
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

// Binding our active server application instance to listen directly on our designated system port
app.listen(PORT, () => {
  // Print verification text out to our development environment terminal when ignition finishes smoothly
  console.log(`Server is running on port ${PORT}`);
});