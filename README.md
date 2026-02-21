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

## Deployment

### Backend → Render
1. Push repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect repo, set root dir to `backend`
4. Add env var: `CORS_ORIGIN` = your Vercel frontend URL
5. The `render.yaml` handles the rest

> **Note:** Use Render Starter ($7/mo) or higher for WebSocket support. Free tier spins down after 15 min of inactivity.

### Frontend → Vercel
1. Go to [vercel.com](https://vercel.com) → New Project
2. Connect repo, set root dir to `frontend`
3. Add env var: `VITE_BACKEND_URL` = your Render backend URL (e.g. `https://your-app.onrender.com`)
4. Deploy

---

## Environment Variables

### Backend `.env`
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port (auto-set by Render) |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin |
| `NODE_ENV` | `development` | Environment |

### Frontend `.env.local`
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_BACKEND_URL` | `http://localhost:3001` | Backend WebSocket URL |

---

## Architecture Highlights

- **In-memory only** — no database required. Rooms GC'd 10min after game ends.
- **Server-authoritative timer** — prevents cheating & drift. Clients interpolate with rAF.
- **Anti-race condition** — `timerRef` stored per room, cleared before any round-end logic fires.
- **Soft disconnect** — players have a 30s grace window to reconnect with scores intact.
- **Stroke batching** — draw events flushed every 16ms (not per pixel) to minimize bandwidth.
