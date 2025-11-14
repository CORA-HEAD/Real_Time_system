// backend/server.js
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

// In-memory state
let queue = [];
let currentTurn = "";
let currentLogo = "";   // base64 string or URL
let currentTitle = "Welcome Event";

function broadcastQueue() {
  io.emit("queue-update", queue);
}

function broadcastTurn() {
  io.emit("turn-update", currentTurn);
}

function broadcastBranding() {
  io.emit("logo-update", currentLogo);
  io.emit("title-update", currentTitle);
}

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Send initial data
  socket.emit("queue-update", queue);
  socket.emit("turn-update", currentTurn);
  socket.emit("logo-update", currentLogo);
  socket.emit("title-update", currentTitle);

  // Queue operations
  socket.on("queue-add", (name) => {
    if (!name || !name.toString().trim()) return;
    const n = name.toString().trim();
    // prevent duplicates (optional)
    if (!queue.includes(n)) {
      queue.push(n);
      broadcastQueue();
    }
  });

  socket.on("queue-remove", (name) => {
    queue = queue.filter((n) => n !== name);
    broadcastQueue();
  });

  socket.on("queue-clear", () => {
    queue = [];
    broadcastQueue();
  });

  socket.on("set-turn", (name) => {
    if (name && queue.includes(name)) {
      queue = queue.filter((n) => n !== name);
      broadcastQueue();
    }
    currentTurn = name || "WAITING";
    broadcastTurn();
  });

  socket.on("queue-next", () => {
    if (queue.length > 0) {
      currentTurn = queue.shift();
      broadcastQueue();
    } else {
      currentTurn = "WAITING";
    }
    broadcastTurn();
  });

  // BRANDING: Accept separate events set-logo / set-title (backwards compatibility)
  socket.on("set-logo", (base64Logo) => {
    currentLogo = base64Logo || "";
    io.emit("logo-update", currentLogo);
  });

  socket.on("set-title", (title) => {
    currentTitle = title || "";
    io.emit("title-update", currentTitle);
  });

  // BRANDING: Accept combined 'branding-update' (this is what your Admin currently emits)
  socket.on("branding-update", (data) => {
    if (data) {
      if (data.logo !== undefined) currentLogo = data.logo || "";
      if (data.title !== undefined) currentTitle = data.title || "";
      // broadcast both so viewers + admin UIs update
      broadcastBranding();
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
