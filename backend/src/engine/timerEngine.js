// src/engine/timerEngine.js

const { getRoom } = require('../state/rooms');
const { revealHintChar } = require('./wordBank');
const logger = require('../utils/logger');

const ROUND_DURATION_MS = 60_000;
const TICK_INTERVAL_MS = 1_000;

// Reveal when timeLeft drops below these thresholds
const HINT_REVEAL_AT = [40, 20];

function startRoundTimer(roomCode, io, onRoundEnd) {
  const room = getRoom(roomCode);
  if (!room) return;

  clearRoundTimer(roomCode);

  room.round.startTime = Date.now();
  room.round.endTime = room.round.startTime + ROUND_DURATION_MS;

  // Track fired hints to prevent duplicates
  room.round._revealedHints = new Set();

  room.round.timerRef = setInterval(() => {
    const r = getRoom(roomCode);
    if (!r || r.status !== 'drawing') {
      clearRoundTimer(roomCode);
      return;
    }

    const timeLeft = Math.max(
      0,
      Math.floor((r.round.endTime - Date.now()) / 1000)
    );

    io.to(roomCode).emit('round:tick', { timeLeft });

    // 🔥 Reliable hint logic
    HINT_REVEAL_AT.forEach((checkpoint) => {
      if (
        timeLeft <= checkpoint &&
        !r.round._revealedHints.has(checkpoint)
      ) {
        r.round._revealedHints.add(checkpoint);

        r.round.wordHint = revealHintChar(
          r.round.word,
          r.round.wordHint
        );

        io.to(roomCode).emit('round:hintReveal', {
          hintMask: r.round.wordHint,
        });
      }
    });

    if (timeLeft <= 0) {
      clearRoundTimer(roomCode);
      logger.info(
        `[${roomCode}] Timer expired — ending round ${r.round.current}`
      );
      onRoundEnd(roomCode, io);
    }

  }, TICK_INTERVAL_MS);
}

function clearRoundTimer(roomCode) {
  const room = getRoom(roomCode);
  if (!room) return;

  if (room.round.timerRef) {
    clearInterval(room.round.timerRef);
    room.round.timerRef = null;
  }
}

module.exports = { startRoundTimer, clearRoundTimer, ROUND_DURATION_MS };