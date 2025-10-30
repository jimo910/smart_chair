// server.js

const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const bodyParser = require("body-parser");
const path = require("path");
const mysql = require("mysql2");

// Express + WS setup
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// ✅ MySQL Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",        // change if you set another user
  password: "Yamjam@2020",        // your MySQL password
  database: "smart_chair"
});

db.connect((err) => {
  if (err) throw err;
  console.log("✅ Connected to MySQL Database");
});

// Latest data cache
let latestData = {
  timestamp: new Date().toISOString(),
  heartRate: 0,
  temperature: 0,
  sugarLevel: 0
};

// WebSocket connections
wss.on("connection", (ws) => {
  console.log("🔗 New WebSocket client connected");
  ws.send(JSON.stringify(latestData));
});

// POST /data → receive sensor readings
app.post("/data", (req, res) => {
  const { heartRate, temperature, sugarLevel } = req.body;

  latestData = {
    timestamp: new Date().toISOString(),
    heartRate: heartRate || 0,
    temperature: temperature || 0,
    sugarLevel: sugarLevel || 0
  };

  console.log("📥 Data Received:", latestData);

  // Save into MySQL
  const sql = "INSERT INTO readings (heartRate, temperature, sugarLevel) VALUES (?, ?, ?)";
  db.query(sql, [latestData.heartRate, latestData.temperature, latestData.sugarLevel], (err) => {
    if (err) throw err;
    console.log("💾 Data saved to MySQL");
  });

  // Broadcast to WebSocket clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(latestData));
    }
  });

  res.json({ status: "success", data: latestData });
});

// GET /data → latest reading
app.get("/data", (req, res) => {
  res.json(latestData);
});

// GET /reports → all saved readings
app.get("/reports", (req, res) => {
  db.query("SELECT * FROM readings ORDER BY timestamp DESC LIMIT 50", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
