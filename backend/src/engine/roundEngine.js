// src/engine/roundEngine.js
// Orchestrates the full round lifecycle. No socket handlers live here —
// this is pure state + io.emit logic to keep handlers thin.

const {
  getRoom,
  getConnectedPlayers,
  getConnectedCount,
  resetRoundState,
  playerSnapshot,
} = require('../state/rooms');
const { getRandomWords, buildHintMask, shuffle } = require('./wordBank');
const { calcGuesserScore, calcDrawerBonus, buildLeaderboard } = require('./scoringEngine');
const { startRoundTimer, clearRoundTimer } = require('./timerEngine');
const logger = require('../utils/logger');

const TOTAL_ROUNDS = 10;
const WORD_PICK_TIMEOUT_MS = 15_000;
const ROUND_END_PAUSE_MS = 5_000;
const GAME_START_COUNTDOWN_MS = 3_000;

// ─── Game Start ───────────────────────────────────────────────────────────────

function startGame(roomCode, io) {
  const room = getRoom(roomCode);
  if (!room) return;

  room.status = 'starting';
  room.round.current = 0;
  room.roundHistory = [];

  // Reset all scores
  Object.values(room.players).forEach((p) => {
    p.score = 0;
    p.hasGuessedCorrectly = false;
    p.guessOrder = null;
  });

  // Pre-shuffle drawer order from connected players
  const connected = getConnectedPlayers(roomCode).map((p) => p.socketId);
  room.round.drawerOrder = shuffle(connected);

  io.to(roomCode).emit('game:starting', { countdown: GAME_START_COUNTDOWN_MS / 1000 });

  setTimeout(() => {
    advanceRound(roomCode, io);
  }, GAME_START_COUNTDOWN_MS);
}

// ─── Round Advance ────────────────────────────────────────────────────────────

function advanceRound(roomCode, io) {
  const room = getRoom(roomCode);
  if (!room) return;

  room.round.current += 1;

  if (room.round.current > TOTAL_ROUNDS) {
    endGame(roomCode, io);
    return;
  }

  resetRoundState(roomCode);

  // Pick drawer — skip disconnected players
  let drawerSocketId = null;
  const order = room.round.drawerOrder;
  const idx = (room.round.current - 1) % order.length;
  // Walk forward until we find a connected player
  for (let i = 0; i < order.length; i++) {
    const candidate = order[(idx + i) % order.length];
    const p = room.players[candidate];
    if (p && p.isConnected) {
      drawerSocketId = candidate;
      break;
    }
  }

  if (!drawerSocketId) {
    // No connected players — abort
    endGame(roomCode, io);
    return;
  }

  room.round.drawerSocketId = drawerSocketId;
  room.status = 'drawing';

  const drawerName = room.players[drawerSocketId]?.name || 'Unknown';
  const hintMask = '';

  io.to(roomCode).emit('round:new', {
    round: room.round.current,
    total: TOTAL_ROUNDS,
    drawerSocketId,
    drawerName,
    hintMask,
  });

  // Send word choices to drawer only
  const words = getRandomWords(3);
  room.round.wordChoices = words;
  io.to(drawerSocketId).emit('round:wordChoices', { words });

  logger.info(`[${roomCode}] Round ${room.round.current} — Drawer: ${drawerName}`);

  // Auto-pick if drawer doesn't choose in time
  room.round._wordPickTimeout = setTimeout(() => {
    const r = getRoom(roomCode);
    if (!r || r.round.word) return; // already chosen
    lockWord(roomCode, r.round.wordChoices[0] || 'mystery', io);
  }, WORD_PICK_TIMEOUT_MS);
}

// ─── Word Lock ────────────────────────────────────────────────────────────────

function lockWord(roomCode, word, io) {
  const room = getRoom(roomCode);
  if (!room || room.round.word) return; // already locked

  if (room.round._wordPickTimeout) {
    clearTimeout(room.round._wordPickTimeout);
    room.round._wordPickTimeout = null;
  }

  room.round.word = word;
  room.round.wordHint = buildHintMask(word);

  const timeLeft = 60;
  io.to(roomCode).emit('round:wordLocked', {
    hintMask: room.round.wordHint,
    timeLeft,
  });

  // Tell the drawer the actual word via the existing round:wordLocked
  // We'll send extra info just to drawer
  io.to(room.round.drawerSocketId).emit('round:wordRevealToDrawer', { word });

  startRoundTimer(roomCode, io, endRound);
}

// ─── Round End ────────────────────────────────────────────────────────────────

function endRound(roomCode, io) {
  const room = getRoom(roomCode);
  if (!room || room.status === 'roundEnd' || room.status === 'gameOver') return;

  room.status = 'roundEnd';
  clearRoundTimer(roomCode);

  const { word, drawerSocketId, correctGuessCount } = room.round;

  // Award drawer bonus
  const drawerBonus = calcDrawerBonus(correctGuessCount);
  if (room.players[drawerSocketId]) {
    room.players[drawerSocketId].score += drawerBonus;
  }

  // Build score deltas for results screen
  const scores = Object.values(room.players).map((p) => ({
    socketId: p.socketId,
    name: p.name,
    totalScore: p.score,
  }));

  const leaderboard = buildLeaderboard(room.players);

  room.roundHistory.push({
    round: room.round.current,
    word,
    drawerName: room.players[drawerSocketId]?.name || 'Unknown',
    leaderboard,
  });

  io.to(roomCode).emit('round:end', {
    word,
    drawerBonus,
    scores,
    leaderboard,
  });

  logger.info(`[${roomCode}] Round ${room.round.current} ended. Word: "${word}"`);

  setTimeout(() => {
    advanceRound(roomCode, io);
  }, ROUND_END_PAUSE_MS);
}

// ─── Game Over ────────────────────────────────────────────────────────────────

function endGame(roomCode, io) {
  const room = getRoom(roomCode);
  if (!room) return;

  room.status = 'gameOver';
  const finalLeaderboard = buildLeaderboard(room.players);

  io.to(roomCode).emit('game:over', {
    finalLeaderboard,
    roundHistory: room.roundHistory,
  });

  logger.info(`[${roomCode}] Game over. Winner: ${finalLeaderboard[0]?.name}`);

  // Clean up room after 10 minutes
  setTimeout(() => {
    const { deleteRoom } = require('../state/rooms');
    deleteRoom(roomCode);
    logger.info(`[${roomCode}] Room garbage collected`);
  }, 10 * 60 * 1000);
}

// ─── Early Round End (all guessed) ───────────────────────────────────────────

function checkAllGuessed(roomCode, io) {
  const room = getRoom(roomCode);
  if (!room) return;
  const connected = getConnectedPlayers(roomCode);
  const nonDrawers = connected.filter((p) => p.socketId !== room.round.drawerSocketId);
  const allGuessed = nonDrawers.length > 0 && nonDrawers.every((p) => p.hasGuessedCorrectly);
  if (allGuessed) {
    clearRoundTimer(roomCode);
    endRound(roomCode, io);
  }
}

module.exports = { startGame, lockWord, endRound, checkAllGuessed };
