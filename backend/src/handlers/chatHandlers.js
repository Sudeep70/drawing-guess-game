// src/handlers/chatHandlers.js

const { getRoom, getPlayer } = require('../state/rooms');
const { isCorrectGuess } = require('../utils/normalize');
const { calcGuesserScore, buildLeaderboard } = require('../engine/scoringEngine');
const { checkAllGuessed } = require('../engine/roundEngine');

const RATE_LIMIT_MS = 300; // min ms between guesses per player
const lastGuessTime = {}; // { socketId: timestamp }

module.exports = function registerChatHandlers(io, socket) {
  socket.on('chat:guess', ({ message } = {}) => {
    const { roomCode } = socket.data;
    const room = getRoom(roomCode);
    if (!room || !message?.trim()) return;

    const text = message.trim().slice(0, 100); // cap length
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

    // If game isn't in drawing phase, just chat
    if (room.status !== 'drawing' || !room.round.word) {
      io.to(roomCode).emit('chat:message', {
        name: player.name,
        message: text,
        isSystem: false,
      });
      return;
    }

    // Player already guessed correctly — chat only (word hidden)
    if (player.hasGuessedCorrectly) {
      // Only send to other already-correct players + drawer to prevent spoilers
      socket.emit('chat:message', { name: player.name, message: text, isSystem: false });
      io.to(room.round.drawerSocketId).emit('chat:message', {
        name: player.name, message: text, isSystem: false,
      });
      return;
    }

    // Rate limit
    const now = Date.now();
    if (lastGuessTime[socket.id] && now - lastGuessTime[socket.id] < RATE_LIMIT_MS) return;
    lastGuessTime[socket.id] = now;

    // Evaluate guess
    if (isCorrectGuess(text, room.round.word)) {
      player.hasGuessedCorrectly = true;
      player.guessOrder = ++room.round.correctGuessCount;

      const timeLeft = Math.max(0, Math.round((room.round.endTime - Date.now()) / 1000));
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
    } else {
      // Wrong guess — broadcast to room as chat
      io.to(roomCode).emit('chat:message', {
        name: player.name,
        message: text,
        isSystem: false,
      });
    }
  });
};
