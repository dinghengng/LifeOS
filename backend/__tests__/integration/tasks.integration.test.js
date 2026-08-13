// Integration tests for the Tasks feature.

const request = require("supertest");

const hasTestDb = !!process.env.DATABASE_URL;
const describeIfDb = hasTestDb ? describe : describe.skip;

describeIfDb("Tasks API (integration)", () => {
  let app;
  let pool;
  let authHeader;
  let userId;

  beforeAll(async () => {
    app = require("../../app");
    pool = require("../../db");

    const email = `integration.tasks.${Date.now()}@example.com`;
    const username = `inttasks${Date.now()}`;

    // Registering through the real /auth/register endpoint 
    const registerRes = await request(app).post("/auth/register").send({
      email,
      password: "TestPassword123!",
      username,
    });
    expect(registerRes.status).toBe(201);

    authHeader = `Bearer ${registerRes.body.token}`;
    userId = registerRes.body.id;
  });

  afterAll(async () => {
    if (userId) {
      // Cascades to sessions/tasks etc. per the schema's ON DELETE CASCADE
      // leaves the test DB clean for the next run.
      await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    }
    await pool.end();
  });

  // Integration test 01: Create a task via POST and verify it appears in GET.
  it("creates a task via POST and returns it via a subsequent GET", async () => {
    const title = `Integration task ${Date.now()}`;

    const createRes = await request(app)
      .post("/tasks")
      .set("Authorization", authHeader)
      .send({ title, dueDate: null, priority: "high" });

    expect(createRes.status).toBe(201);
    expect(createRes.body.title).toBe(title);
    expect(createRes.body.priority).toBe("high");

    const listRes = await request(app).get("/tasks").set("Authorization", authHeader);
    expect(listRes.status).toBe(200);
    expect(listRes.body.some((t) => t.title === title)).toBe(true);
  });

  // Integration test 02: invalid priority value to 'none' server-side
  it("coerces an invalid priority value down to 'none' server-side", async () => {
    const title = `Bad priority task ${Date.now()}`;

    const createRes = await request(app)
      .post("/tasks")
      .set("Authorization", authHeader)
      .send({ title, dueDate: null, priority: "URGENT!!" });

    expect(createRes.status).toBe(201);
    expect(createRes.body.priority).toBe("none");
  });

  // Integration test 03: Mark a task as complete
  it("marks a task complete via PUT and reflects it on GET", async () => {
    const title = `Completable task ${Date.now()}`;
    const createRes = await request(app)
      .post("/tasks")
      .set("Authorization", authHeader)
      .send({ title, dueDate: null, priority: "none" });
    const taskId = createRes.body.id;

    const updateRes = await request(app)
      .put(`/tasks/${taskId}`)
      .set("Authorization", authHeader)
      .send({ isCompleted: true });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.is_completed).toBe(true);
    expect(updateRes.body.completed_at).not.toBeNull();
  });

  // Integration test 04: PATCH updates only the provided fields, leaving the rest untouched
  it("PATCH updates only the provided fields, leaving the rest untouched", async () => {
    const title = `Patchable task ${Date.now()}`;
    const createRes = await request(app)
      .post("/tasks")
      .set("Authorization", authHeader)
      .send({ title, dueDate: null, priority: "critical" });
    const taskId = createRes.body.id;

    const newTitle = `${title} (edited)`;
    const patchRes = await request(app)
      .patch(`/tasks/${taskId}`)
      .set("Authorization", authHeader)
      .send({ title: newTitle });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.title).toBe(newTitle);
    // Priority wasn't included in the PATCH body, so COALESCE should have
    // kept the original value rather than resetting it.
    expect(patchRes.body.priority).toBe("critical");
  });

  // Integration test 05: Delete a task
  it("deletes a task via DELETE and it no longer appears in GET", async () => {
    const title = `Deletable task ${Date.now()}`;
    const createRes = await request(app)
      .post("/tasks")
      .set("Authorization", authHeader)
      .send({ title, dueDate: null, priority: "none" });
    const taskId = createRes.body.id;

    const deleteRes = await request(app)
      .delete(`/tasks/${taskId}`)
      .set("Authorization", authHeader);
    expect(deleteRes.status).toBe(200);

    const listRes = await request(app).get("/tasks").set("Authorization", authHeader);
    expect(listRes.body.some((t) => t.id === taskId)).toBe(false);
  });

  // Integration test 06 — per-user data isolation, enforced at the DB layer
  it("returns 404 when a user tries to delete another user's task", async () => {
    const otherEmail = `integration.other.${Date.now()}@example.com`;
    const otherUsername = `intother${Date.now()}`;
    const otherRegisterRes = await request(app).post("/auth/register").send({
      email: otherEmail,
      password: "TestPassword123!",
      username: otherUsername,
    });
    const otherAuthHeader = `Bearer ${otherRegisterRes.body.token}`;
    const otherUserId = otherRegisterRes.body.id;

    const createRes = await request(app)
      .post("/tasks")
      .set("Authorization", authHeader)
      .send({ title: "Owned by user A", dueDate: null, priority: "none" });
    const taskId = createRes.body.id;

    const deleteAsOtherRes = await request(app)
      .delete(`/tasks/${taskId}`)
      .set("Authorization", otherAuthHeader);
    expect(deleteAsOtherRes.status).toBe(404);

    // The task should still exist for its actual owner.
    const listRes = await request(app).get("/tasks").set("Authorization", authHeader);
    expect(listRes.body.some((t) => t.id === taskId)).toBe(true);

    await pool.query("DELETE FROM users WHERE id = $1", [otherUserId]);
  });

  // Integration test 07
  it("returns 401 for requests with no session token at all", async () => {
    const res = await request(app).get("/tasks");
    expect(res.status).toBe(401);
  });

  // Integration test 08
  it("rejects registration with an already-used email with 409", async () => {
    const email = `integration.dupe.${Date.now()}@example.com`;
    const first = await request(app).post("/auth/register").send({
      email,
      password: "TestPassword123!",
      username: `intdupe1${Date.now()}`,
    });
    expect(first.status).toBe(201);

    const second = await request(app).post("/auth/register").send({
      email,
      password: "TestPassword123!",
      username: `intdupe2${Date.now()}`,
    });
    expect(second.status).toBe(409);

    await pool.query("DELETE FROM users WHERE id = $1", [first.body.id]);
  });

  // Integration test 09
  it("rejects registration with a password under 8 characters with 400", async () => {
    const res = await request(app).post("/auth/register").send({
      email: `integration.shortpw.${Date.now()}@example.com`,
      password: "short1",
      username: `intshort${Date.now()}`,
    });
    expect(res.status).toBe(400);
  });
});
