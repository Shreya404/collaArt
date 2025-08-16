const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();

const FRONTEND_ORIGINS = [
  "http://localhost:5173",             // Vite dev server URL for local testing
  process.env.FRONTEND_URL || "*"      // Production frontend URL (set in Railway vars), fallback to '*'
];

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
  socket.emit('shapes:init', shapes);

  socket.on('shapes:update', (newShapes) => {
    shapes = newShapes;
    socket.broadcast.emit('shapes:update', shapes);
  });

  socket.on('disconnect', () => {});
});

const port = process.env.PORT || 8080;
io.listen(port, () => {
  console.log(`Socket.IO server running on port ${port}`);
});