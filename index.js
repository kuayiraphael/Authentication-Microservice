// const express = require("express");
// const cors = require("cors");
// const { CreateChannel, SubscribeMessage } = require("./utils");
// const customerRoutes = require("./api/customer");
// const mongoose = require("mongoose");
// const dotenv = require("dotenv");
// const redis = require('redis');
// const print = console.log;

// dotenv.config(); // Load environment variables from .env file

// // Create Redis client(~)
// const redisClient = redis.createClient({
//   url: process.env.REDIS_URL
// });

// redisClient.on('error', (err) => {
//   console.log('Redis Client Error', err);
// });

// redisClient.on('connect', () => {
//   console.log('Redis client connected');
// });

// const app = express();
// app.use(express.json());
// app.use(cors());
// app.use(express.static(__dirname + "/public"));

// async function startApp() {
//   try {
//     await mongoose.connect(process.env.DB_URI);
//     print("Auth Service Database Connected");

//     await redisClient.connect();  // Connect to Redis(~)

//     const channel = await CreateChannel();

//    // await customerRoutes(app, channel);

//     await customerRoutes(app, channel, redisClient);  // Pass Redis client to routes(~)

//     app.listen(8001, () => {
//       console.log("Customer is Listening to Port 8001");
//     });
//   } catch (err) {
//     console.log("Failed to start app:", err);
//   }
// }

// module.exports = startApp;
const express = require("express");
const cors = require("cors");
const { CreateChannel } = require("./utils");
const customerRoutes = require("./api/customer");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const redis = require("redis");

dotenv.config(); // Load environment variables from .env file

// Create Redis client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
});

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

// Function to initialize database and Redis connections
async function initializeServices() {
  try {
    // Connect to MongoDB and Redis asynchronously
    const mongoConnection = mongoose.connect(process.env.DB_URI);
    const redisConnection = redisClient.connect();

    // Wait for both to complete
    await Promise.all([mongoConnection, redisConnection]);

    console.log("Database and Redis connected");

    // Create a Redis channel after connections are established
    const channel = await CreateChannel();
    console.log("Redis channel created");

    return { channel, redisClient };
  } catch (err) {
    console.error("Failed to initialize services:", err);
    throw err;
  }
}

// Export the serverless function
module.exports = async (req, res) => {
  try {
    // Initialize the services
    const { channel, redisClient } = await initializeServices();

    // Set up customer routes
    await customerRoutes(app, channel, redisClient);

    // Return the Express app for handling the request
    app(req, res);
  } catch (err) {
    res.status(500).json({ error: "Initialization failed" });
  }
};
