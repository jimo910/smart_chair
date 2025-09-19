
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const bodyParser = require("body-parser");
const path = require("path");
const mysql = require("mysql2"); 

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve frontend files

// Store latest sensor data in memory
let latestData = {
  timestamp: new Date().toISOString(),
  heartRate: 0,
  temperature: 0,
  sugarLevel: 0
};

// Handle WebSocket connections
wss.on("connection", (ws) => {
  console.log("🔗 New WebSocket client connected");

  // Send the latest data immediately when client connects
  ws.send(JSON.stringify(latestData));
});

// HTTP POST endpoint (sensor sends data here)
app.post("/data", (req, res) => {
  const { heartRate, temperature, sugarLevel } = req.body;

  // Update data
  latestData = {
    timestamp: new Date().toISOString(),
    heartRate: heartRate || 0,
    temperature: temperature || 0,
    sugarLevel: sugarLevel || 0
  };

  console.log("📥 Data Received:", latestData);

  // Broadcast new data to all connected WebSocket clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(latestData));
    }
  });

  res.json({ status: "success", data: latestData });
});

const db = mysql.createConnection({
  host: "localhost",
  user: "root",        // default user
  password: "Yamjam@2020",        // enter your MySQL password here (if you set one)
  database: "smart_chair"
});

// Optional GET endpoint (manual check / fallback)
app.get("/data", (req, res) => {
  res.json(latestData);
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
