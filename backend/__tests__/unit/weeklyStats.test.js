// Unit tests for backend/services/weeklyStats.js.

const dbPath = require.resolve("../../db");
const pool = { query: vi.fn() };
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: pool };


const { composeWeeklyInsights } = require("../../services/weeklyStats");

function mockQueryByPattern(patterns) {
  pool.query.mockImplementation((sql) => {
    for (const [needle, response] of patterns) {
      if (sql.includes(needle)) return Promise.resolve(response);
    }
    return Promise.resolve({ rows: [] });
  });
}

beforeEach(() => {
  pool.query.mockReset();
});

describe("composeWeeklyInsights — habits", () => {
  it("omits the habits section when the user has no habits at all", async () => {
    mockQueryByPattern([
      ["FROM habits WHERE user_id", { rows: [] }],
    ]);
    const result = await composeWeeklyInsights(1);
    expect(result === null || result.habits === null).toBe(true);
  });

  it("computes per-day completion rate and identifies the best/worst day", async () => {
    mockQueryByPattern([
      [
        "FROM habits WHERE user_id",
        { rows: [{ id: 1, name: "Run", streak: 3, category: "fitness" }] },
      ],
      [
        "FROM habit_logs",
        {
          rows: [
            { habit_id: 1, date: "2026-01-12", status: "done" }, // Mon
            { habit_id: 1, date: "2026-01-13", status: "missed" }, // Tue
          ],
        },
      ],
    ]);
    const result = await composeWeeklyInsights(1);
    expect(result.habits.best_day).toBe("Mon");
    expect(result.habits.worst_day).toBe("Tue");
    expect(result.habits.habit_count).toBe(1);
  });


  it("picks the habit with the highest streak as the top habit", async () => {
    mockQueryByPattern([
      [
        "FROM habits WHERE user_id",
        {
          rows: [
            { id: 1, name: "Run", streak: 3, category: "fitness" },
            { id: 2, name: "Read", streak: 12, category: "learning" },
          ],
        },
      ],
      ["FROM habit_logs", { rows: [] }],
    ]);
    const result = await composeWeeklyInsights(1);
    expect(result.habits.top_habit).toEqual({ name: "Read", streak: 12 });
  });
});

describe("composeWeeklyInsights — mood", () => {
  it("omits the mood section when there are no mood logs this week", async () => {
    mockQueryByPattern([["FROM mood_logs", { rows: [] }]]);
    const result = await composeWeeklyInsights(1);
    expect(result === null || result.mood === null).toBe(true);
  });


  it.each([
    { current: 4.0, previous: 3.0, expectedTrend: "improving" },
    { current: 3.0, previous: 4.0, expectedTrend: "declining" },
    { current: 3.5, previous: 3.4, expectedTrend: "flat" },
  ])("labels the trend as $expectedTrend for current avg $current vs previous avg $previous", async ({ current, previous, expectedTrend }) => {
    let call = 0;
    pool.query.mockImplementation((sql) => {
      if (sql.includes("FROM mood_logs") && sql.includes("stress_level")) {
        // First mood_logs call = current week.
        return Promise.resolve({
          rows: [{ mood_level: current, stress_level: 3 }],
        });
      }
      if (sql.includes("FROM mood_logs")) {
        // Second mood_logs call (previous week) doesn't select stress_level.
        return Promise.resolve({ rows: [{ mood_level: previous }] });
      }
      return Promise.resolve({ rows: [] });
    });
    const result = await composeWeeklyInsights(1);
    expect(result.mood.trend).toBe(expectedTrend);
  });
});

describe("composeWeeklyInsights — goals", () => {

  it("omits the goals section when there are no active goals", async () => {
    mockQueryByPattern([["FROM goals", { rows: [] }]]);
    const result = await composeWeeklyInsights(1);
    expect(result === null || result.goals === null).toBe(true);
  });

  it("computes average progress and surfaces the nearest deadline first", async () => {
    mockQueryByPattern([
      [
        "FROM goals",
        {
          rows: [
            { title: "Ship LifeOS", progress: 80, due_date: "2026-02-01" },
            { title: "Read 12 books", progress: 40, due_date: "2026-06-01" },
          ],
        },
      ],
    ]);
    const result = await composeWeeklyInsights(1);
    expect(result.goals.avg_progress).toBe(60);
    expect(result.goals.nearest_deadline.title).toBe("Ship LifeOS");
  });
});

describe("composeWeeklyInsights — tasks", () => {
  it("splits completed vs pending task counts due this week", async () => {
    mockQueryByPattern([
      [
        "FROM tasks",
        {
          rows: [
            { is_completed: true, count: "3" },
            { is_completed: false, count: "2" },
          ],
        },
      ],
    ]);
    const result = await composeWeeklyInsights(1);
    expect(result.tasks.completed_this_week_approx).toBe(3);
    expect(result.tasks.still_pending_due_this_week).toBe(2);
  });
});

describe("composeWeeklyInsights — overall", () => {
  it("returns null when habits, mood, goals, and tasks are all empty", async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const result = await composeWeeklyInsights(1);
    expect(result).toBeNull();
  });
});
