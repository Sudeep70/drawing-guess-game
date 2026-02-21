// src/components/Leaderboard/Leaderboard.jsx
import useGameStore from '../../store/useGameStore';
import styles from './Leaderboard.module.css';

export default function Leaderboard() {
  const players = useGameStore((s) => s.players);
  const round = useGameStore((s) => s.round);
  const mySocketId = useGameStore((s) => s.mySocketId);

  const sorted = [...players]
    .filter((p) => p.isConnected)
    .sort((a, b) => b.score - a.score);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>Players</div>
      <div className={styles.list}>
        {sorted.map((p, i) => {
          const isDrawer = p.socketId === round.drawerSocketId;
          const isMe = p.socketId === mySocketId;
          return (
            <div key={p.socketId} className={`${styles.row} ${isMe ? styles.me : ''}`}>
              <span className={styles.rank}>#{i + 1}</span>
              <span className={styles.name}>
                {p.name}
                {isDrawer && <span className={styles.badge}>✏️</span>}
                {p.hasGuessedCorrectly && <span className={styles.badge}>✓</span>}
              </span>
              <span className={styles.score}>{p.score}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
