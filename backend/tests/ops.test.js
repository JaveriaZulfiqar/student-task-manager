const request = require("supertest");
const mongoose = require("mongoose");
const { startDb, stopDb, newApp } = require("./helpers");

const app = newApp();

describe("operational endpoints", () => {
  it("/health is up even without a database", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("/ready reports 503 before the DB is connected and 200 after", async () => {
    expect(mongoose.connection.readyState).not.toBe(1);
    expect((await request(app).get("/ready")).status).toBe(503);
    await startDb();
    expect((await request(app).get("/ready")).status).toBe(200);
    await stopDb();
  });

  it("/metrics exposes Prometheus metrics including per-route latency", async () => {
    await request(app).get("/health");
    const res = await request(app).get("/metrics");
    expect(res.status).toBe(200);
    expect(res.text).toContain("process_cpu_user_seconds_total");
    expect(res.text).toContain("http_request_duration_seconds_count");
  });

  it("unknown API routes return JSON 404, not HTML", async () => {
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Not found");
  });

  it("sets security headers and hides x-powered-by", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-powered-by"]).toBeUndefined();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });
});

describe("serving the built frontend", () => {
  it("serves index.html for client-side routes when a build exists", async () => {
    const fs = require("fs");
    const os = require("os");
    const path = require("path");
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stm-dist-"));
    fs.writeFileSync(path.join(dir, "index.html"), "<html>spa</html>");
    const spa = require("../app")({ staticDir: dir });
    const res = await request(spa).get("/tasks/42");
    expect(res.status).toBe(200);
    expect(res.text).toContain("spa");
  });
});
