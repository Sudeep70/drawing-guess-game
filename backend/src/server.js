// src/server.js
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

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// ─── HTTP + Socket.io Server ──────────────────────────────────────────────────
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 20000,
  pingInterval: 10000,
});

// ─── Socket.io Connection ─────────────────────────────────────────────────────
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  // Initialize socket metadata
  socket.data.roomCode = null;
  socket.data.playerName = null;

  // Register all event handlers
  registerRoomHandlers(io, socket);
  registerGameHandlers(io, socket);
  registerDrawHandlers(io, socket);
  registerChatHandlers(io, socket);

  socket.on('disconnect', (reason) => {
    logger.info(`Socket disconnected: ${socket.id} — ${reason}`);
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`CORS origin: ${CORS_ORIGIN}`);
});
