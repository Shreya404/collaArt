const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// --- CHANGE THIS IN PRODUCTION ---
const FRONTEND_ORIGINS = [
  "http://localhost:5173",           // Vite dev server
  "https://your-vercel-app.vercel.app"  // <-- REPLACE with your Vercel domain after deploying frontend
];

const app = express();

app.use(cors({
  origin: FRONTEND_ORIGINS,
  methods: ["GET", "POST"],
  credentials: true
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGINS,
    methods: ["GET", "POST"]
  }
});

let shapes = []; // Shared whiteboard state

io.on('connection', (socket) => {
  // Send current shapes to new client
  socket.emit('shapes:init', shapes);

  // When client updates shapes
  socket.on('shapes:update', (newShapes) => {
    shapes = newShapes;
    socket.broadcast.emit('shapes:update', shapes); // broadcast to all others
  });

  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
