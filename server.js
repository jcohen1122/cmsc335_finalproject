require("dotenv").config(); // Load environment variables from .env

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const https = require("https");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs"); // Use EJS as the templating engine
app.set("views", path.join(__dirname, "views")); // Define the views directory
app.use(express.static("views"));

// Load MongoDB credentials
const {
  MONGO_DB_USERNAME,
  MONGO_DB_PASSWORD,
  MONGO_DB_NAME,
  MONGO_COLLECTION,
} = process.env;

// MongoDB connection
const mongoUri = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@cluster0.emtki.mongodb.net/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// MongoDB Schema and Model
const playerSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
});

const Player = mongoose.model(MONGO_COLLECTION, playerSchema);

// Cache for testing
let cachedPlayers = null;

// Route to render the EJS template
app.get("/", async (req, res) => {
  try {
    // Fetch available players (cached during testing)
    const availablePlayers = cachedPlayers || [];
    console.log(cachedPlayers);

    // Fetch team players from MongoDB
    const teamPlayers = await Player.find({});

    res.render("index", { availablePlayers, teamPlayers });
  } catch (error) {
    console.error("Error rendering page:", error);
    res.status(500).send("An error occurred");
  }
});

// Route to fetch available players from API or cache
app.get("/fetch-available-players", (req, res) => {
  if (cachedPlayers) {
    return res.json(cachedPlayers); // Return cached players during testing
  }

  const options = {
    method: "GET",
    hostname: "api-football-v1.p.rapidapi.com",
    path: "/v3/players",
    headers: {
      "x-rapidapi-key": "4acbca8e15msh36930cfebff6dffp1f17a4jsn00e6d00a7042",
      "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
    },
  };

  const reqApi = https.request(options, (resApi) => {
    const chunks = [];

    resApi.on("data", (chunk) => chunks.push(chunk));
    console.log(`Chunks = ${chunks}`);
    resApi.on("end", () => {
      const body = Buffer.concat(chunks).toString();
      const players = JSON.parse(body).response.map((player) => ({
        firstName: player.firstname,
        lastName: player.lastname,
      }));

      console.log(cachedPlayers);
      cachedPlayers = players; // Cache the result for testing

      res.json(players);
    });
  });

  reqApi.on("error", (error) => {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch players" });
  });

  reqApi.end();
});

// Route to add a player to the team
app.post("/add-player", async (req, res) => {
  const { firstName, lastName } = req.body;

  if (!firstName || !lastName) {
    return res
      .status(400)
      .json({ error: "First name and last name are required" });
  }

  try {
    const newPlayer = new Player({ firstName, lastName });
    await newPlayer.save();
    res.redirect("/"); // Redirect to homepage after adding player
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to add player");
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
