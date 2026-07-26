// Importing all the tools we need for our server
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const pool = require("./db");
require("dotenv").config();
const { createNotificationRouter } = require("./routes/notifications");
const { createInsightsRouter } = require("./routes/ai");
const { startReminderJobs } = require("./jobs/reminderJob");
const { createAuthRouter, createUserProfileRouter } = require("./routes/user");
const { createTasksRouter } = require("./routes/tasks");
const { createMoodRouter, createJournalRouter } = require("./routes/journal");
const { createHabitsRouter, createGoalsRouter } = require("./routes/dashboard");
const {
  createNutritionRouter,
  createSupplementsRouter,
} = require("./routes/nutrition");
const { createChallengesRouter } = require("./routes/challenges");
const { createSocialRouter } = require("./routes/social");

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

      // Matches local development domains and any incoming wireless subnet pattern variations
      if (
        allowedOrigins.includes(origin) ||
        origin.includes("192.168.1.") ||
        origin.includes("192.168.")
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // Explicitly allow preflight
    allowedHeaders: ["Content-Type", "Authorization"], // Crucial: allows session cookies to pass through
  }),
);

// Checks browser cookies or Mobile Authorization headers
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

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/notifications", createNotificationRouter(requireAuth));
app.use("/api/insights", createInsightsRouter(requireAuth));

// Auth (register/login/logout/me)
app.use("/auth", createAuthRouter(requireAuth));

// Feature 1: Tasks
app.use("/tasks", createTasksRouter(requireAuth));

// Feature 2: Mood + Journal
app.use("/mood", createMoodRouter(requireAuth));
app.use("/journal", createJournalRouter(requireAuth));

// Feature 3: Dashboard (Habits + Goals)
app.use("/api/habits", createHabitsRouter(requireAuth));
app.use("/api/goals", createGoalsRouter(requireAuth));

// Feature 4: Nutrition 
app.use("/api/nutrition", createNutritionRouter(requireAuth));
app.use("/api/supplements", createSupplementsRouter(requireAuth));

// User profile 
app.use("/api/user", createUserProfileRouter(requireAuth));

// challenges
app.use("/api/challenges", createChallengesRouter(requireAuth));

// social
app.use("/api/social", createSocialRouter(requireAuth));


//Explicitly listen on local host '0.0.0.0' to receive outside network connections
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Server is running natively and open to wireless network devices on port ${PORT}`,
  );
  startReminderJobs();
});