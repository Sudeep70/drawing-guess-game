// src/handlers/chatHandlers.js

const { getRoom, getPlayer } = require('../state/rooms');
const { isCorrectGuess } = require('../utils/normalize');
const { calcGuesserScore, buildLeaderboard } = require('../engine/scoringEngine');
const { checkAllGuessed } = require('../engine/roundEngine');
const { getDifficultyConfig } = require('../engine/difficultyConfig');
const levenshtein = require('fast-levenshtein');

const RATE_LIMIT_MS = 300; // min ms between guesses per player
const lastGuessTime = {}; // { socketId: timestamp }

module.exports = function registerChatHandlers(io, socket) {

  socket.on('chat:guess', ({ message } = {}) => {

    const { roomCode } = socket.data;
    const room = getRoom(roomCode);
    if (!room || !message?.trim()) return;

    const text = message.trim().slice(0, 100);
    const player = getPlayer(roomCode, socket.id);
    if (!player || !player.isConnected) return;

    // Drawer can chat but not guess
    if (socket.id === room.round.drawerSocketId) {
      io.to(roomCode).emit('chat:message', {
        name: player.name,
        message: text,
        isSystem: false,
        isDrawer: true,
      });
      return;
    }

    // If game isn't active, just chat
    if (room.status !== 'drawing' || !room.round.word) {
      io.to(roomCode).emit('chat:message', {
        name: player.name,
        message: text,
        isSystem: false,
      });
      return;
    }

    // Already guessed correctly → prevent spoilers
    if (player.hasGuessedCorrectly) {
      socket.emit('chat:message', {
        name: player.name,
        message: text,
        isSystem: false,
      });

      io.to(room.round.drawerSocketId).emit('chat:message', {
        name: player.name,
        message: text,
        isSystem: false,
      });

      return;
    }

    // Rate limiting
    const now = Date.now();
    if (lastGuessTime[socket.id] && now - lastGuessTime[socket.id] < RATE_LIMIT_MS) return;
    lastGuessTime[socket.id] = now;

    const normalizedGuess = text.toLowerCase().trim();
    const normalizedWord = room.round.word.toLowerCase().trim();

    // ✅ CORRECT GUESS
    if (isCorrectGuess(normalizedGuess, normalizedWord)) {

      player.hasGuessedCorrectly = true;
      player.guessOrder = ++room.round.correctGuessCount;

      const timeLeft = Math.max(
        0,
        Math.round((room.round.endTime - Date.now()) / 1000)
      );

      const scoreEarned = calcGuesserScore(timeLeft, player.guessOrder);
      player.score += scoreEarned;

      const leaderboard = buildLeaderboard(room.players);

      io.to(roomCode).emit('round:correctGuess', {
        socketId: socket.id,
        playerName: player.name,
        guessOrder: player.guessOrder,
        scoreEarned,
        leaderboard,
      });

      io.to(roomCode).emit('chat:message', {
        name: 'System',
        message: `🎉 ${player.name} guessed correctly! (+${scoreEarned} pts)`,
        isSystem: true,
      });

      checkAllGuessed(roomCode, io);
      return;
    }

    // ✅ FUZZY CLOSE DETECTION
const config = getDifficultyConfig(room.difficulty);

const wordLength = normalizedWord.length;

const dynamicTolerance = Math.max(
  1,
  Math.floor(wordLength * config.fuzzyFactor)
);

const distance = levenshtein.get(normalizedGuess, normalizedWord);

// Additional safety checks
const similarityRatio = 1 - (distance / Math.max(wordLength, normalizedGuess.length));

if (
  distance <= dynamicTolerance &&
  similarityRatio >= 0.6 && // must be at least 60% similar
  normalizedGuess !== normalizedWord &&
  Math.abs(normalizedGuess.length - normalizedWord.length) <= 2
) {
  socket.emit('guess:close');
  return;
}

    // ❌ WRONG GUESS
    io.to(roomCode).emit('chat:message', {
      name: player.name,
      message: text,
      isSystem: false,
    });

  });
};