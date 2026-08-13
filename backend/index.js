// Entry point: boots the HTTP server and background jobs.
// The actual Express app (routes, middleware) lives in ./app.js so it can be
// imported by tests without opening a real port or starting cron jobs.
const app = require("./app");
const { startReminderJobs } = require("./jobs/reminderJob");

// Setting our deployment port to check our .env file first, otherwise default to local port 5001
const PORT = process.env.PORT || 5001;

//Explicitly listen on local host '0.0.0.0' to receive outside network connections
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Server is running natively and open to wireless network devices on port ${PORT}`,
  );
  startReminderJobs();
});
