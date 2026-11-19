const request = require("supertest");
const jwt = require("jsonwebtoken");
const { startDb, stopDb, clearDb, newApp } = require("./helpers");

const app = newApp();
const user = { name: "Jane Doe", email: "jane@example.com", password: "secret123" };

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

describe("POST /api/auth/register", () => {
  it("creates a user and returns a token, never the password", async () => {
    const res = await request(app).post("/api/auth/register").send(user);
    expect(res.status).toBe(201);
    expect(res.body.user).toEqual({ id: expect.any(String), name: user.name, email: user.email });
    expect(res.body.user.password).toBeUndefined();
    expect(jwt.verify(res.body.token, process.env.JWT_SECRET).id).toBe(res.body.user.id);
  });

  it("rejects a duplicate email, case-insensitively", async () => {
    await request(app).post("/api/auth/register").send(user);
    const res = await request(app).post("/api/auth/register").send({ ...user, email: "JANE@example.com" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Email already in use");
  });

  it.each([
    ["missing name", { ...user, name: "" }],
    ["invalid email", { ...user, email: "not-an-email" }],
    ["short password", { ...user, password: "123" }],
    ["non-string password", { ...user, password: { $gt: "" } }],
  ])("returns 400 for %s", async (_label, body) => {
    const res = await request(app).post("/api/auth/register").send(body);
    expect(res.status).toBe(400);
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await request(app).post("/api/auth/register").set("Content-Type", "application/json").send("{bad");
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(() => request(app).post("/api/auth/register").send(user));

  it("logs in with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: user.email, password: user.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it("rejects a wrong password and an unknown user with the same message", async () => {
    const wrong = await request(app).post("/api/auth/login").send({ email: user.email, password: "nope-nope" });
    const unknown = await request(app).post("/api/auth/login").send({ email: "x@y.com", password: "secret123" });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.message).toBe(unknown.body.message);
  });

  it("rejects NoSQL-injection style payloads", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: { $ne: null }, password: { $ne: null } });
    expect(res.status).toBe(400);
  });
});
