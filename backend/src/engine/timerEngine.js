// src/engine/timerEngine.js
// Server-authoritative timer. Each room has exactly one timer handle.
// All round-end logic is triggered exclusively from here.

const { getRoom } = require('../state/rooms');
const logger = require('../utils/logger');

const ROUND_DURATION_MS = 60_000;
const TICK_INTERVAL_MS = 1_000;
const HINT_REVEAL_AT = [20, 10]; // seconds remaining

/**
 * Start the round timer for a room.
 * @param {string} roomCode
 * @param {SocketIO.Server} io
 * @param {Function} onRoundEnd - called when timer expires
 */
function startRoundTimer(roomCode, io, onRoundEnd) {
  const room = getRoom(roomCode);
  if (!room) return;

  // Guard: clear any existing timer first
  clearRoundTimer(roomCode);

  room.round.startTime = Date.now();
  room.round.endTime = room.round.startTime + ROUND_DURATION_MS;

  room.round.timerRef = setInterval(() => {
    const r = getRoom(roomCode);
    if (!r || r.status !== 'drawing') {
      clearRoundTimer(roomCode);
      return;
    }

    const timeLeft = Math.max(0, Math.round((r.round.endTime - Date.now()) / 1000));
    io.to(roomCode).emit('round:tick', { timeLeft });

    // Hint reveals
    if (HINT_REVEAL_AT.includes(timeLeft)) {
      const { revealHintChar } = require('./wordBank');
      r.round.wordHint = revealHintChar(r.round.word, r.round.wordHint);
      io.to(roomCode).emit('round:hintReveal', { hintMask: r.round.wordHint });
    }

    if (timeLeft <= 0) {
      clearRoundTimer(roomCode);
      logger.info(`[${roomCode}] Timer expired — ending round ${r.round.current}`);
      onRoundEnd(roomCode, io);
    }
  }, TICK_INTERVAL_MS);
}

/**
 * Clear the timer for a room without triggering round end.
 */
function clearRoundTimer(roomCode) {
  const room = getRoom(roomCode);
  if (!room) return;
  if (room.round.timerRef) {
    clearInterval(room.round.timerRef);
    room.round.timerRef = null;
  }
}

module.exports = { startRoundTimer, clearRoundTimer, ROUND_DURATION_MS };
