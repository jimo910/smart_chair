// server.js

const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const bodyParser = require("body-parser");
const path = require("path");

// Express + WebSocket setup
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Latest data cache (in memory)
let latestData = {
  timestamp: new Date().toISOString(),
  heartRate: 0,
  temperature: 0,
  sugarLevel: 0
};

// Handle WebSocket connections
wss.on("connection", (ws) => {
  console.log("🔗 New WebSocket client connected");
  ws.send(JSON.stringify(latestData)); // send the current data immediately
});

// POST /data → receive data from AJAX or frontend
app.post("/data", (req, res) => {
  const { heartRate, temperature, sugarLevel } = req.body;

  latestData = {
    timestamp: new Date().toISOString(),
    heartRate: heartRate || 0,
    temperature: temperature || 0,
    sugarLevel: sugarLevel || 0
  };

  console.log("📥 Data Received:", latestData);

  // Send data to all WebSocket clients (live update)
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(latestData));
    }
  });

  res.json({ status: "success", data: latestData });
});

// GET /data → get the latest data
app.get("/data", (req, res) => {
  res.json(latestData);
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
