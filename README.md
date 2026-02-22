# 🎨 DrawGuess — Real-Time Multiplayer Drawing Game

A real-time multiplayer drawing & guessing game built with Node.js, Socket.io, and React.

## Features
- Invite-only rooms with 6-char codes
- 6 players max · 10 rounds · 60s per round
- Auto-rotating drawer, word picker, progressive hints
- Real-time leaderboard with live score updates
- Mobile touch support
- Neon UI theme

---

## Project Structure

```
drawing-guess-game/
├── backend/    ← Node.js + Express + Socket.io
├── frontend/   ← React + Vite
└── render.yaml ← Render deploy config
```

---

## Local Development

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
# Runs on http://localhost:3001
```

### 2. Frontend
```bash
cd frontend
npm install
# Create .env.local:
echo "VITE_BACKEND_URL=http://localhost:3001" > .env.local
npm run dev
# Runs on http://localhost:5173
```

---


