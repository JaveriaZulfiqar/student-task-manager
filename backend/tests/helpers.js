const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const createApp = require("../app");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

let mongod;

// Uses a real MongoDB: TEST_MONGO_URI if provided (CI service container),
// otherwise a throwaway in-memory mongod.
async function startDb() {
  const uri = process.env.TEST_MONGO_URI || (mongod = await MongoMemoryServer.create()).getUri("stm-test");
  await mongoose.connect(uri);
}

async function stopDb() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

async function clearDb() {
  for (const c of Object.values(mongoose.connection.collections)) await c.deleteMany({});
}

const newApp = () => createApp({ staticDir: "/nonexistent" });

module.exports = { startDb, stopDb, clearDb, newApp };
