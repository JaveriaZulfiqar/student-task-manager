const request = require("supertest");
const { startDb, stopDb, clearDb, newApp } = require("./helpers");

const app = newApp();
const task = { title: "Write report", description: "DevOps report", dueDate: "2026-12-01" };

async function signUp(email) {
  const res = await request(app).post("/api/auth/register").send({ name: "U", email, password: "secret123" });
  return { Authorization: `Bearer ${res.body.token}` };
}

let auth;
beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
  await clearDb();
  auth = await signUp("a@example.com");
});

describe("authentication", () => {
  it("requires a token", async () => {
    expect((await request(app).get("/api/tasks")).status).toBe(401);
  });
  it("rejects a bad token", async () => {
    const res = await request(app).get("/api/tasks").set("Authorization", "Bearer garbage");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid token");
  });
});

describe("task CRUD", () => {
  it("creates a pending task and lists it", async () => {
    const created = await request(app).post("/api/tasks").set(auth).send(task);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ ...task, status: "pending" });

    const list = await request(app).get("/api/tasks").set(auth);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].id).toBe(created.body.id);
  });

  it("validates required fields", async () => {
    const res = await request(app).post("/api/tasks").set(auth).send({ title: "only title" });
    expect(res.status).toBe(400);
  });

  it("updates status and clears the attachment", async () => {
    const { body } = await request(app).post("/api/tasks").set(auth).send({ ...task, fileName: "a.pdf" });
    const res = await request(app).put(`/api/tasks/${body.id}`).set(auth).send({ status: "completed", fileName: "" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("completed");
    expect(res.body.fileName).toBeNull();
  });

  it("rejects an invalid status and an invalid id", async () => {
    const { body } = await request(app).post("/api/tasks").set(auth).send(task);
    expect((await request(app).put(`/api/tasks/${body.id}`).set(auth).send({ status: "done" })).status).toBe(400);
    expect((await request(app).put("/api/tasks/not-an-id").set(auth).send({})).status).toBe(400);
    expect((await request(app).delete("/api/tasks/not-an-id").set(auth)).status).toBe(400);
  });

  it("deletes a task, then returns 404", async () => {
    const { body } = await request(app).post("/api/tasks").set(auth).send(task);
    expect((await request(app).delete(`/api/tasks/${body.id}`).set(auth)).status).toBe(200);
    expect((await request(app).delete(`/api/tasks/${body.id}`).set(auth)).status).toBe(404);
  });
});

describe("tenant isolation", () => {
  it("never lets one user read, edit or delete another user's task", async () => {
    const other = await signUp("b@example.com");
    const { body } = await request(app).post("/api/tasks").set(auth).send(task);

    expect((await request(app).get("/api/tasks").set(other)).body).toEqual([]);
    expect((await request(app).put(`/api/tasks/${body.id}`).set(other).send({ title: "hacked" })).status).toBe(404);
    expect((await request(app).delete(`/api/tasks/${body.id}`).set(other)).status).toBe(404);
    expect((await request(app).get("/api/tasks").set(auth)).body[0].title).toBe(task.title);
  });
});
