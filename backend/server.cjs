const express = require('express');
const http = require('http'); // Fix: no asterisks*
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();

// FRONTEND_ORIGINS must be an array for Socket.IO, but for Express' CORS, origin should be a string or function
const localOrigin = "http://localhost:5173";
const prodOrigin = process.env.FRONTEND_URL; // Set this in Railway variables panel!
const allowedOrigins = [localOrigin];
if (prodOrigin) allowedOrigins.push(prodOrigin);

// Express CORS middleware -- enable credentials, restrict to allowed origins
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl) or from allowed list
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

// Socket.IO CORS configuration (always supply an array!)
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
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

// Start on correct port: Express/Socket.IO server listens together!
const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`Socket.IO server running on port ${port}`);
});
