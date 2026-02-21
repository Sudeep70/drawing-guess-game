// src/pages/WaitingRoom.jsx
import socket from '../socket/socket';
import useGameStore from '../store/useGameStore';
import PlayerList from '../components/Lobby/PlayerList';
import InviteLink from '../components/Lobby/InviteLink';
import styles from './WaitingRoom.module.css';

export default function WaitingRoom() {
  const isHost = useGameStore((s) => s.isHost());
  const players = useGameStore((s) => s.players);
  const canStart = players.filter((p) => p.isConnected).length >= 2;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h2 className={styles.title}>Waiting Room</h2>
        <InviteLink />
        <PlayerList />
        {isHost ? (
          <button
            className="btn-primary"
            style={{ width: '100%', maxWidth: 380 }}
            onClick={() => socket.emit('game:start')}
            disabled={!canStart}
          >
            {canStart ? '▶ Start Game' : 'Need at least 2 players'}
          </button>
        ) : (
          <p className={styles.waiting}>Waiting for host to start...</p>
        )}
      </div>
    </div>
  );
}
