require("dotenv").config();
const mongoose = require("mongoose");
const createApp = require("./app");
const connectDB = require("./config/db");

const { MONGO_URI, JWT_SECRET } = process.env;
const PORT = process.env.PORT || 5000;

// Fail fast: the old version silently started with a missing secret.
if (!MONGO_URI || !JWT_SECRET) {
  console.error("MONGO_URI and JWT_SECRET must be set (see .env.example)");
  process.exit(1);
}

async function main() {
  await connectDB(MONGO_URI);
  const server = createApp().listen(PORT, () => console.log(`Server running on port ${PORT}`));

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main();
