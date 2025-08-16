const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();

const allowedOrigins = [
  "http://localhost:5173", // Local dev
  "https://collaart.vercel.app",
  process.env.FRONTEND_URL // e.g., https://collaart-frontend-production.up.railway.app
];

// Express CORS middleware
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST"],
  credentials: true
}));

const server = http.createServer(app);

// Socket.IO CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

let shapes = [];

io.on('connection', (socket) => {
  socket.emit('shapes:init', shapes);
  socket.on('shapes:update', (newShapes) => {
    shapes = newShapes;
    socket.broadcast.emit('shapes:update', shapes);
  });
});

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`Socket.IO server running on port ${port}`);
});
