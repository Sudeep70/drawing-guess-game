// src/handlers/gameHandlers.js

const { getRoom, getConnectedCount } = require('../state/rooms');
const { startGame, lockWord, endRound } = require('../engine/roundEngine');
const { clearRoundTimer } = require('../engine/timerEngine');
const logger = require('../utils/logger');

const DRAWER_RECONNECT_WINDOW_MS = 10_000;

module.exports = function registerGameHandlers(io, socket) {
  // ─── game:start ───────────────────────────────────────────────────────────────
  socket.on('game:start', () => {
    const { roomCode } = socket.data;
    const room = getRoom(roomCode);

    if (!room) return socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
    if (room.hostSocketId !== socket.id) {
      return socket.emit('error', { code: 'NOT_HOST', message: 'Only the host can start the game' });
    }
    if (room.status !== 'waiting' && room.status !== 'gameOver') {
      return socket.emit('error', { code: 'GAME_IN_PROGRESS', message: 'Game already in progress' });
    }
    if (getConnectedCount(roomCode) < 2) {
      return socket.emit('error', { code: 'NOT_ENOUGH_PLAYERS', message: 'Need at least 2 players' });
    }

    startGame(roomCode, io);
  });

  // ─── round:wordSelected ───────────────────────────────────────────────────────
  socket.on('round:wordSelected', ({ word } = {}) => {
    const { roomCode } = socket.data;
    const room = getRoom(roomCode);

    if (!room) return;
    if (room.round.drawerSocketId !== socket.id) {
      return socket.emit('error', { code: 'NOT_YOUR_TURN', message: 'You are not the drawer' });
    }
    if (room.round.word) {
      return; // already locked, ignore
    }
    if (!room.round.wordChoices.includes(word)) {
      return socket.emit('error', { code: 'INVALID_WORD', message: 'Invalid word selection' });
    }

    lockWord(roomCode, word, io);
  });

  // ─── Handle drawer disconnect mid-round ───────────────────────────────────────
  // Called from roomHandlers via 'room:playerLeft' broadcast awareness.
  // We listen on the server-side disconnect chain.
  socket.on('disconnect', () => {
    const { roomCode } = socket.data;
    const room = getRoom(roomCode);
    if (!room) return;
    if (room.status !== 'drawing') return;
    if (room.round.drawerSocketId !== socket.id) return;

    // Drawer disconnected mid-round
    clearRoundTimer(roomCode);
    io.to(roomCode).emit('chat:message', {
      name: 'System',
      message: 'The drawer disconnected. Waiting 10 seconds for reconnect...',
      isSystem: true,
    });

    logger.warn(`[${roomCode}] Drawer disconnected mid-round`);

    // After window, skip round if still disconnected
    room.round._drawerReconnectTimeout = setTimeout(() => {
      const r = getRoom(roomCode);
      if (!r) return;
      const drawerPlayer = r.players[r.round.drawerSocketId];
      if (!drawerPlayer || !drawerPlayer.isConnected) {
        io.to(roomCode).emit('chat:message', {
          name: 'System',
          message: `Skipping round. The word was "${r.round.word || '???'}"`,
          isSystem: true,
        });
        endRound(roomCode, io);
      }
    }, DRAWER_RECONNECT_WINDOW_MS);
  });
};
