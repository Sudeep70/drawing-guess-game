// src/store/useGameStore.js
import { create } from 'zustand';
import socket from '../socket/socket';

const useGameStore = create((set, get) => ({
  // ─── Identity ───────────────────────────────────────────────────────────────
  mySocketId: null,
  myName: '',
  roomCode: null,

  // ─── Room ───────────────────────────────────────────────────────────────────
  hostSocketId: null,
  players: [],       // array of { socketId, name, score, isConnected, hasGuessedCorrectly }
  status: 'idle',    // idle | waiting | starting | drawing | roundEnd | gameOver

  // ─── Round ──────────────────────────────────────────────────────────────────
  round: {
    current: 0,
    total: 10,
    drawerSocketId: null,
    drawerName: '',
    word: '',         // only set for drawer
    wordHint: '',
    timeLeft: 60,
    correctGuessCount: 0,
  },

  // ─── UI ─────────────────────────────────────────────────────────────────────
  chat: [],           // { id, name, message, isSystem, isDrawer }
  leaderboard: [],    // { socketId, name, score }
  wordChoices: [],    // shown to drawer
  roundEndData: null, // { word, scores, leaderboard }
  finalData: null,    // { finalLeaderboard, roundHistory }
  error: null,

  // ─── Derived ────────────────────────────────────────────────────────────────
  isDrawer: () => get().mySocketId === get().round.drawerSocketId,
  isHost: () => get().mySocketId === get().hostSocketId,

  // ─── Actions ────────────────────────────────────────────────────────────────
  setMyName: (name) => set({ myName: name }),

  addChatMessage: (msg) =>
    set((s) => ({
      chat: [...s.chat.slice(-199), { id: Date.now() + Math.random(), ...msg }],
    })),

  applyRoomSnapshot: (room) =>
    set({
      roomCode: room.roomCode,
      hostSocketId: room.hostSocketId,
      status: room.status,
      players: room.players,
      round: { ...get().round, ...room.round },
    }),

  updateTimeLeft: (timeLeft) =>
    set((s) => ({ round: { ...s.round, timeLeft } })),

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      roomCode: null,
      hostSocketId: null,
      players: [],
      status: 'idle',
      round: {
        current: 0, total: 10, drawerSocketId: null,
        drawerName: '', word: '', wordHint: '', timeLeft: 60, correctGuessCount: 0,
      },
      chat: [],
      leaderboard: [],
      wordChoices: [],
      roundEndData: null,
      finalData: null,
      error: null,
    }),
}));

// ─── Wire up all socket events to store ─────────────────────────────────────

socket.on('connect', () => {
  useGameStore.setState({ mySocketId: socket.id, error: null });
});

socket.on('disconnect', () => {
  useGameStore.setState({ mySocketId: null });
});

socket.on('error', ({ code, message }) => {
  useGameStore.setState({ error: `${code}: ${message}` });
});

socket.on('room:created', ({ roomCode }) => {
  useGameStore.setState({ roomCode });
});

socket.on('room:joined', ({ room }) => {
  useGameStore.getState().applyRoomSnapshot(room);
  useGameStore.setState({ status: room.status });
});

socket.on('room:playerJoined', ({ player }) => {
  useGameStore.setState((s) => ({
    players: [...s.players.filter((p) => p.socketId !== player.socketId), player],
  }));
  useGameStore.getState().addChatMessage({
    name: 'System', message: `${player.name} joined`, isSystem: true,
  });
});

socket.on('room:playerLeft', ({ socketId, name }) => {
  useGameStore.setState((s) => ({
    players: s.players.map((p) =>
      p.socketId === socketId ? { ...p, isConnected: false } : p
    ),
  }));
  useGameStore.getState().addChatMessage({
    name: 'System', message: `${name} disconnected`, isSystem: true,
  });
});

socket.on('game:starting', ({ countdown }) => {
  useGameStore.setState({ status: 'starting', wordChoices: [], roundEndData: null });
  useGameStore.getState().addChatMessage({
    name: 'System', message: `Game starting in ${countdown}...`, isSystem: true,
  });
});

socket.on('round:new', ({ round, total, drawerSocketId, drawerName, hintMask }) => {
  useGameStore.setState((s) => ({
    status: 'drawing',
    wordChoices: [],
    roundEndData: null,
    round: {
      ...s.round,
      current: round,
      total,
      drawerSocketId,
      drawerName,
      wordHint: hintMask,
      word: '',
      timeLeft: 60,
      correctGuessCount: 0,
    },
    players: s.players.map((p) => ({ ...p, hasGuessedCorrectly: false })),
  }));
  useGameStore.getState().addChatMessage({
    name: 'System',
    message: `Round ${round}/${total} — ${drawerName} is drawing!`,
    isSystem: true,
  });
});

socket.on('round:wordChoices', ({ words }) => {
  useGameStore.setState({ wordChoices: words });
});

socket.on('round:wordRevealToDrawer', ({ word }) => {
  useGameStore.setState((s) => ({ round: { ...s.round, word } }));
});

socket.on('round:wordLocked', ({ hintMask, timeLeft }) => {
  useGameStore.setState((s) => ({
    round: { ...s.round, wordHint: hintMask, timeLeft },
    wordChoices: [],
  }));
});

socket.on('round:hintReveal', ({ hintMask }) => {
  useGameStore.setState((s) => ({ round: { ...s.round, wordHint: hintMask } }));
});

socket.on('round:tick', ({ timeLeft }) => {
  useGameStore.setState((s) => ({ round: { ...s.round, timeLeft } }));
});

socket.on('round:correctGuess', ({ playerName, guessOrder, scoreEarned, leaderboard }) => {
  useGameStore.setState((s) => ({
    leaderboard,
    round: { ...s.round, correctGuessCount: guessOrder },
    players: s.players.map((p) =>
      p.name === playerName ? { ...p, hasGuessedCorrectly: true } : p
    ),
  }));
});

socket.on('round:end', (data) => {
  useGameStore.setState({ status: 'roundEnd', roundEndData: data, leaderboard: data.leaderboard });
});

socket.on('game:over', (data) => {
  useGameStore.setState({ status: 'gameOver', finalData: data });
});

socket.on('chat:message', (msg) => {
  useGameStore.getState().addChatMessage(msg);
});

export default useGameStore;
