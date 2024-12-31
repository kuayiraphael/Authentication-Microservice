const express = require("express");
const cors = require("cors");
const { CreateChannel, SubscribeMessage } = require("./utils");
const customerRoutes = require("./api/customer");
const appEvents = require("./api/app-events");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const print = console.log;

dotenv.config(); // Load environment variables from .env file

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname + "/public"));

async function startApp() {
  try {
    await mongoose.connect(process.env.DB_URI);
    print("Auth Service Database Connected");

    const channel = await CreateChannel();

    await customerRoutes(app, channel);

    app.listen(8001, () => {
      console.log("Customer is Listening to Port 8001");
    });
  } catch (err) {
    console.log("Failed to start app:", err);
  }
}

startApp();
