// src/handlers/drawHandlers.js

const { getRoom } = require('../state/rooms');

const MAX_STROKES = 5000; // prevent memory explosion

module.exports = function registerDrawHandlers(io, socket) {
  // ─── draw:stroke ──────────────────────────────────────────────────────────────
  socket.on('draw:stroke', (stroke) => {
    const { roomCode } = socket.data;
    const room = getRoom(roomCode);
    if (!room || room.status !== 'drawing') return;
    if (room.round.drawerSocketId !== socket.id) return; // only drawer can draw

    // Validate stroke shape
    if (!stroke || typeof stroke.x !== 'number' || typeof stroke.y !== 'number') return;

    const sanitized = {
      type: stroke.type || 'move',
      x: stroke.x,
      y: stroke.y,
      color: typeof stroke.color === 'string' ? stroke.color.slice(0, 20) : '#000000',
      size: Math.min(Math.max(Number(stroke.size) || 4, 1), 50),
      timestamp: Date.now(),
    };

    // Store for reconnect replay (bounded)
    if (room.round.canvas.strokes.length < MAX_STROKES) {
      room.round.canvas.strokes.push(sanitized);
    }

    // Relay to all non-drawers
    socket.to(roomCode).emit('draw:stroke', sanitized);
  });

  // ─── draw:clear ───────────────────────────────────────────────────────────────
  socket.on('draw:clear', () => {
    const { roomCode } = socket.data;
    const room = getRoom(roomCode);
    if (!room || room.status !== 'drawing') return;
    if (room.round.drawerSocketId !== socket.id) return;

    // Clear stored strokes too
    room.round.canvas.strokes = [];
    socket.to(roomCode).emit('draw:clear');
  });
};
