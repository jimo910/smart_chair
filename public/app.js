// app.js (Frontend)

// Connect to WebSocket server (adjust URL if needed)
const socket = new WebSocket("ws://localhost:3000");

// DOM elements
const heartRateEl = document.getElementById("heartRate");
const tempEl = document.getElementById("temperature");
const sugarEl = document.getElementById("sugarLevel");
const reportsTable = document.getElementById("reportsTable");
const alertBox = document.getElementById("alertBox");

// Chart.js references
let heartRateChart, tempChart, sugarChart;

// When connected
socket.onopen = () => {
  console.log("Connected to WebSocket server ✅");
};

// When receiving new sensor data
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  const { timestamp, heartRate, temperature, sugarLevel } = data;

  // Update live cards
  heartRateEl.innerText = heartRate;
  tempEl.innerText = temperature.toFixed(1);
  sugarEl.innerText = sugarLevel;

  // Update charts
  updateChart(heartRateChart, timestamp, heartRate);
  updateChart(tempChart, timestamp, temperature);
  updateChart(sugarChart, timestamp, sugarLevel);

  // Add to reports table
  const row = `<tr>
                <td>${timestamp}</td>
                <td>${heartRate}</td>
                <td>${temperature.toFixed(1)}</td>
                <td>${sugarLevel}</td>
              </tr>`;
  reportsTable.innerHTML = row + reportsTable.innerHTML;

  // Check alerts
  checkAlerts(heartRate, temperature, sugarLevel);
};

// Update Chart.js function
function updateChart(chart, label, value) {
  if (!chart) return;
  chart.data.labels.push(label);
  chart.data.datasets[0].data.push(value);

  // Limit to last 10 points
  if (chart.data.labels.length > 10) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }
  chart.update();
}

// Alerts logic
function checkAlerts(heartRate, temperature, sugarLevel) {
  let alerts = [];

  if (heartRate > 120) alerts.push(`⚠️ High Heart Rate: ${heartRate} BPM`);
  if (temperature > 38) alerts.push(`🌡️ High Temperature: ${temperature} °C`);
  if (sugarLevel > 180) alerts.push(`🩸 High Sugar Level: ${sugarLevel} mg/dL`);

  if (alerts.length > 0) {
    alertBox.innerHTML = alerts.map(msg =>
      `<div class="alert alert-danger">${msg}</div>`
    ).join("");
  } else {
    alertBox.innerHTML = `<div class="alert alert-success">✅ All readings normal</div>`;
  }
}

// Initialize charts
function initCharts() {
  heartRateChart = new Chart(document.getElementById("heartRateChart"), {
    type: "line",
    data: { labels: [], datasets: [{ label: "Heart Rate", data: [], borderColor: "red", fill: false }] }
  });

  tempChart = new Chart(document.getElementById("tempChart"), {
    type: "line",
    data: { labels: [], datasets: [{ label: "Temperature", data: [], borderColor: "orange", fill: false }] }
  });

  sugarChart = new Chart(document.getElementById("sugarChart"), {
    type: "line",
    data: { labels: [], datasets: [{ label: "Sugar Level", data: [], borderColor: "blue", fill: false }] }
  });
}

// Initialize on page load
window.onload = initCharts;
