const mongoose = require("mongoose");

// Retries so the API survives starting a few seconds before the database
// (docker compose, Kubernetes) instead of crash-looping.
const connectDB = async (uri = process.env.MONGO_URI, { retries = 10, delayMs = 3000 } = {}) => {
  for (let attempt = 1; ; attempt++) {
    try {
      await mongoose.connect(uri);
      console.log("MongoDB connected");
      return;
    } catch (err) {
      if (attempt >= retries) throw err;
      console.error(`MongoDB connection failed (attempt ${attempt}/${retries}): ${err.message}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
};

module.exports = connectDB;
