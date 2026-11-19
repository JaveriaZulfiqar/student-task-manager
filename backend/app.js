const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const createMetrics = require("./config/metrics");

/**
 * Builds the Express app without starting a server or connecting to the
 * database, so the same code can be used by server.js and by the tests.
 */
function createApp({ staticDir = path.join(__dirname, "dist") } = {}) {
  const app = express();
  const metrics = createMetrics();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  // CSP is off because the SPA bundle is served by this same app and we do not
  // maintain a policy yet; every other helmet default stays on.
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(metrics.middleware);
  if (process.env.NODE_ENV !== "test") app.use(morgan("combined"));

  const allowedOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  // Same-origin requests (the SPA is served by this app) never need CORS.
  // Extra origins, e.g. the Vite dev server, come from CORS_ORIGINS.
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
      credentials: true,
    })
  );
  app.use(express.json({ limit: "100kb" }));

  // --- operational endpoints -------------------------------------------------
  app.get("/health", (_req, res) => res.json({ status: "ok", uptime: process.uptime() }));
  app.get("/ready", (_req, res) => {
    const ready = mongoose.connection.readyState === 1;
    res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "database unavailable" });
  });
  app.get("/metrics", async (_req, res) => {
    res.set("Content-Type", metrics.register.contentType);
    res.end(await metrics.register.metrics());
  });

  // --- API -------------------------------------------------------------------
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.AUTH_RATE_LIMIT_MAX || 100),
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message: "Too many attempts, please try again later" },
  });
  app.use("/api/auth", authLimiter, require("./routes/authRoutes"));
  app.use("/api/tasks", require("./routes/taskRoutes"));
  app.use("/api", (_req, res) => res.status(404).json({ message: "Not found" }));

  // --- single page app -------------------------------------------------------
  if (fs.existsSync(path.join(staticDir, "index.html"))) {
    app.use(express.static(staticDir));
    app.get("/{*path}", (_req, res) => res.sendFile(path.join(staticDir, "index.html")));
  }

  app.use((err, _req, res, _next) => {
    if (err.type === "entity.parse.failed") return res.status(400).json({ message: "Invalid JSON" });
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  });

  return app;
}

module.exports = createApp;
