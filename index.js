const express = require("express");
const cors = require("cors");
const { CreateChannel, SubscribeMessage } = require("./utils");
const customerRoutes = require("./api/customer");
const appEvents = require("./api/app-events");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const redis = require("redis");
const print = console.log;

dotenv.config(); // Load environment variables from .env file

// Create Redis client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
});
const port =  process.env.PORT || 8001;
redisClient.on("error", (err) => {
  console.log("Redis Client Error", err);
});

redisClient.on("connect", () => {
  console.log("Redis client connected");
});

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname + "/public"));

async function startApp() {
  try {
    await mongoose.connect(process.env.DB_URI);
    print("Auth Service Database Connected");

    await redisClient.connect(); // Connect to Redis

    const channel = await CreateChannel();

    await customerRoutes(app, channel, redisClient); // Pass Redis client to routes
    app.listen(port, () => {
      console.log(`Auth Service is Listening to Port ${port}`);
    }); // Pass Redis client to routes

    app.get("/health", (req, res) => {
      res.send("Customer Service Running");
    });
  } catch (err) {
    console.log("Failed to start app:", err);
  }
}

startApp();


