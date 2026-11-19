const client = require("prom-client");

// One registry per app instance so tests can create many apps without
// "metric already registered" errors.
function createMetrics() {
  const register = new client.Registry();
  client.collectDefaultMetrics({ register });

  const httpDuration = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status"],
    buckets: [0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [register],
  });

  const middleware = (req, res, next) => {
    const end = httpDuration.startTimer();
    res.on("finish", () => {
      // Use the route pattern (e.g. /api/tasks/:id), not the raw URL, to keep label cardinality low.
      const route = req.route ? `${req.baseUrl}${req.route.path}` : req.baseUrl || "unmatched";
      end({ method: req.method, route, status: res.statusCode });
    });
    next();
  };

  return { register, middleware };
}

module.exports = createMetrics;
