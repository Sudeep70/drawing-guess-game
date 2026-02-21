require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const logger = require('./utils/logger');

const registerRoomHandlers = require('./handlers/roomHandlers');
const registerGameHandlers = require('./handlers/gameHandlers');
const registerDrawHandlers = require('./handlers/drawHandlers');
const registerChatHandlers = require('./handlers/chatHandlers');

// ─────────────────────────────────────────
// ENV CONFIG
// ─────────────────────────────────────────
const PORT = process.env.PORT || 3001;

// Allow multiple origins (comma separated in env)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173'];

// ─────────────────────────────────────────
// EXPRESS APP
// ─────────────────────────────────────────
const app = express();

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());

app.get('/health', (_, res) =>
  res.json({ status: 'ok', uptime: process.uptime() })
);

// ─────────────────────────────────────────
// HTTP + SOCKET.IO
// ─────────────────────────────────────────
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.includes('*') ? true : allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 20000,
  pingInterval: 10000,
});

// ─────────────────────────────────────────
// SOCKET CONNECTION
// ─────────────────────────────────────────
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.data.roomCode = null;
  socket.data.playerName = null;

  registerRoomHandlers(io, socket);
  registerGameHandlers(io, socket);
  registerDrawHandlers(io, socket);
  registerChatHandlers(io, socket);

  socket.on('disconnect', (reason) => {
    logger.info(`Socket disconnected: ${socket.id} — ${reason}`);
  });
});

// ─────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────
server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`🌍 Allowed origins: ${allowedOrigins.join(', ')}`);
});