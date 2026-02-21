// src/socket/socket.js
import { io } from 'socket.io-client';
import useGameStore from '../store/useGameStore';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// ─────────────────────────────────────────
// Register global listeners
// ─────────────────────────────────────────

socket.on('chat:message', (msg) => {
  useGameStore.getState().addChatMessage({
    ...msg,
    id: Date.now() + Math.random(),
  });
});

socket.on('guess:close', () => {
  useGameStore.getState().addChatMessage({
    id: Date.now() + Math.random(),
    name: 'System',
    message: "🔥 You're close!",
    isSystem: true,
  });
});

export default socket;