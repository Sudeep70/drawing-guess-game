// src/App.jsx
import useGameStore from './store/useGameStore';
import LobbyPage from './pages/LobbyPage';
import WaitingRoom from './pages/WaitingRoom';
import GamePage from './pages/GamePage';

export default function App() {
  const status = useGameStore((s) => s.status);
  const roomCode = useGameStore((s) => s.roomCode);

  // No room yet → show lobby
  if (!roomCode || status === 'idle') return <LobbyPage />;

  // In room, game not started
  if (status === 'waiting') return <WaitingRoom />;

  // Game is active (starting | drawing | roundEnd | gameOver)
  return <GamePage />;
}
