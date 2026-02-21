// src/state/rooms.js
// Single in-memory store for all active rooms.
// All mutations go through these helpers to keep logic centralised.

const rooms = {};

// ─── Accessors ────────────────────────────────────────────────────────────────

function getRoom(roomCode) {
  return rooms[roomCode] || null;
}

function getRooms() {
  return rooms;
}

// ─── Room Lifecycle ───────────────────────────────────────────────────────────

function createRoom(roomCode, hostSocketId, hostName) {
  rooms[roomCode] = {
    roomCode,
    hostSocketId,
    status: 'waiting', // waiting | starting | drawing | roundEnd | gameOver
    players: {
      [hostSocketId]: createPlayer(hostSocketId, hostName),
    },
    round: createEmptyRound(),
    roundHistory: [],
  };
  return rooms[roomCode];
}

function deleteRoom(roomCode) {
  delete rooms[roomCode];
}

// ─── Player Helpers ───────────────────────────────────────────────────────────

function createPlayer(socketId, name) {
  return {
    socketId,
    name,
    score: 0,
    isConnected: true,
    joinedAt: Date.now(),
    hasGuessedCorrectly: false,
    guessOrder: null,
  };
}

function addPlayer(roomCode, socketId, name) {
  const room = rooms[roomCode];
  if (!room) return null;
  room.players[socketId] = createPlayer(socketId, name);
  return room.players[socketId];
}

function getPlayer(roomCode, socketId) {
  const room = rooms[roomCode];
  return room ? room.players[socketId] : null;
}

function getConnectedPlayers(roomCode) {
  const room = rooms[roomCode];
  if (!room) return [];
  return Object.values(room.players).filter((p) => p.isConnected);
}

function getConnectedCount(roomCode) {
  return getConnectedPlayers(roomCode).length;
}

function markDisconnected(roomCode, socketId) {
  const player = getPlayer(roomCode, socketId);
  if (player) player.isConnected = false;
}

function markConnected(roomCode, socketId) {
  const player = getPlayer(roomCode, socketId);
  if (player) player.isConnected = true;
}

function removePlayer(roomCode, socketId) {
  const room = rooms[roomCode];
  if (!room) return;
  delete room.players[socketId];
}

// ─── Round Helpers ────────────────────────────────────────────────────────────

function createEmptyRound() {
  return {
    current: 0,
    total: 10,
    drawerSocketId: null,
    drawerOrder: [],
    word: '',
    wordHint: '',
    correctGuessCount: 0,
    startTime: null,
    endTime: null,
    timerRef: null,
    wordChoices: [],
    canvas: { strokes: [] },
  };
}

function resetRoundState(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  // Reset per-round player flags
  Object.values(room.players).forEach((p) => {
    p.hasGuessedCorrectly = false;
    p.guessOrder = null;
  });
  // Reset canvas
  room.round.canvas.strokes = [];
  room.round.correctGuessCount = 0;
  room.round.word = '';
  room.round.wordHint = '';
  room.round.wordChoices = [];
  room.round.startTime = null;
  room.round.endTime = null;
}

// ─── Snapshot Helpers (safe to send to clients) ───────────────────────────────

function roomSnapshot(roomCode, forSocketId) {
  const room = rooms[roomCode];
  if (!room) return null;
  const isDrawer = room.round.drawerSocketId === forSocketId;
  return {
    roomCode: room.roomCode,
    hostSocketId: room.hostSocketId,
    status: room.status,
    players: Object.values(room.players).map(playerSnapshot),
    round: {
      current: room.round.current,
      total: room.round.total,
      drawerSocketId: room.round.drawerSocketId,
      wordHint: room.round.wordHint,
      // Only reveal word to the current drawer
      word: isDrawer ? room.round.word : undefined,
      correctGuessCount: room.round.correctGuessCount,
      startTime: room.round.startTime,
      endTime: room.round.endTime,
    },
  };
}

function playerSnapshot(player) {
  return {
    socketId: player.socketId,
    name: player.name,
    score: player.score,
    isConnected: player.isConnected,
    hasGuessedCorrectly: player.hasGuessedCorrectly,
  };
}

module.exports = {
  rooms,
  getRoom,
  getRooms,
  createRoom,
  deleteRoom,
  addPlayer,
  getPlayer,
  getConnectedPlayers,
  getConnectedCount,
  markDisconnected,
  markConnected,
  removePlayer,
  createEmptyRound,
  resetRoundState,
  roomSnapshot,
  playerSnapshot,
};
