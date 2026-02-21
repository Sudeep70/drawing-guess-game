// src/handlers/roomHandlers.js

const {
  createRoom,
  getRoom,
  addPlayer,
  getPlayer,
  getConnectedCount,
  getConnectedPlayers,
  markConnected,
  markDisconnected,
  removePlayer,
  roomSnapshot,
  playerSnapshot,
} = require('../state/rooms');
const { generateRoomCode } = require('../utils/roomCode');
const logger = require('../utils/logger');

const MAX_PLAYERS = 6;

// Reconnect grace timers: { socketId: TimeoutHandle }
const reconnectTimers = {};

module.exports = function registerRoomHandlers(io, socket) {
  // ─── room:create ─────────────────────────────────────────────────────────────
  socket.on('room:create', ({ playerName } = {}) => {
    if (!playerName?.trim()) {
      return socket.emit('error', { code: 'INVALID_NAME', message: 'Name is required' });
    }

    const roomCode = generateRoomCode();
    const room = createRoom(roomCode, socket.id, playerName.trim());
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.playerName = playerName.trim();

    socket.emit('room:created', { roomCode, playerId: socket.id });
    socket.emit('room:joined', { room: roomSnapshot(roomCode, socket.id) });

    logger.info(`[${roomCode}] Created by ${playerName}`);
  });

  // ─── room:join ────────────────────────────────────────────────────────────────
  socket.on('room:join', ({ roomCode, playerName } = {}) => {
    const code = roomCode?.toUpperCase().trim();
    const name = playerName?.trim();

    if (!name) return socket.emit('error', { code: 'INVALID_NAME', message: 'Name is required' });

    const room = getRoom(code);
    if (!room) return socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });

    if (room.status !== 'waiting') {
      return socket.emit('error', { code: 'GAME_IN_PROGRESS', message: 'Game already started' });
    }

    if (getConnectedCount(code) >= MAX_PLAYERS) {
      return socket.emit('error', { code: 'ROOM_FULL', message: 'Room is full (max 6)' });
    }

    const player = addPlayer(code, socket.id, name);
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.playerName = name;

    socket.emit('room:joined', { room: roomSnapshot(code, socket.id) });
    socket.to(code).emit('room:playerJoined', { player: playerSnapshot(player) });

    logger.info(`[${code}] ${name} joined (${getConnectedCount(code)}/${MAX_PLAYERS})`);
  });

  // ─── room:leave ───────────────────────────────────────────────────────────────
  socket.on('room:leave', () => {
    handleLeave(socket, io, false);
  });

  // ─── player:reconnect ─────────────────────────────────────────────────────────
  socket.on('player:reconnect', ({ roomCode, oldSocketId } = {}) => {
    const code = roomCode?.toUpperCase().trim();
    const room = getRoom(code);
    if (!room) return socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });

    const player = getPlayer(code, oldSocketId);
    if (!player) {
      return socket.emit('error', { code: 'RECONNECT_FAILED', message: 'Session not found' });
    }

    // Cancel grace timer
    if (reconnectTimers[oldSocketId]) {
      clearTimeout(reconnectTimers[oldSocketId]);
      delete reconnectTimers[oldSocketId];
    }

    // Re-key player under new socket id
    room.players[socket.id] = { ...player, socketId: socket.id, isConnected: true };
    delete room.players[oldSocketId];

    // Update host if needed
    if (room.hostSocketId === oldSocketId) room.hostSocketId = socket.id;
    if (room.round.drawerSocketId === oldSocketId) room.round.drawerSocketId = socket.id;

    // Update drawerOrder
    const idx = room.round.drawerOrder.indexOf(oldSocketId);
    if (idx !== -1) room.round.drawerOrder[idx] = socket.id;

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.playerName = player.name;

    socket.emit('room:joined', { room: roomSnapshot(code, socket.id) });

    // Replay canvas strokes so reconnected player sees current drawing
    if (room.round.canvas.strokes.length > 0) {
      socket.emit('draw:replay', { strokes: room.round.canvas.strokes });
    }

    socket.to(code).emit('room:playerJoined', { player: playerSnapshot(room.players[socket.id]) });
    logger.info(`[${code}] ${player.name} reconnected`);
  });

  // ─── disconnect ───────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    handleLeave(socket, io, true);
  });

  function handleLeave(socket, io, isDisconnect) {
    const { roomCode } = socket.data;
    if (!roomCode) return;

    const room = getRoom(roomCode);
    if (!room) return;

    const player = getPlayer(roomCode, socket.id);
    if (!player) return;

    markDisconnected(roomCode, socket.id);
    io.to(roomCode).emit('room:playerLeft', { socketId: socket.id, name: player.name });

    logger.info(`[${roomCode}] ${player.name} ${isDisconnect ? 'disconnected' : 'left'}`);

    if (!isDisconnect) {
      // Voluntary leave — remove immediately
      removePlayer(roomCode, socket.id);
      checkRoomEmpty(roomCode, io);
      return;
    }

    // Drawer disconnect — handled in gameHandlers via 'room:playerLeft' or checked in round engine
    // Start grace period for reconnect
    reconnectTimers[socket.id] = setTimeout(() => {
      delete reconnectTimers[socket.id];
      const r = getRoom(roomCode);
      if (!r) return;
      removePlayer(roomCode, socket.id);
      logger.info(`[${roomCode}] ${player.name} grace period expired — removed`);
      checkRoomEmpty(roomCode, io);
    }, 30_000);
  }

  function checkRoomEmpty(roomCode, io) {
    const room = getRoom(roomCode);
    if (!room) return;
    const connected = getConnectedPlayers(roomCode);
    if (connected.length === 0) {
      const { deleteRoom } = require('../state/rooms');
      const { clearRoundTimer } = require('../engine/timerEngine');
      clearRoundTimer(roomCode);
      deleteRoom(roomCode);
      logger.info(`[${roomCode}] Empty room deleted`);
    }
  }
};
