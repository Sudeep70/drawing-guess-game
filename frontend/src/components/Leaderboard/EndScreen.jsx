// src/components/Leaderboard/EndScreen.jsx
import useGameStore from '../../store/useGameStore';
import socket from '../../socket/socket';
import styles from './Leaderboard.module.css';

export default function EndScreen() {
  const finalData = useGameStore((s) => s.finalData);
  const isHost = useGameStore((s) => s.isHost());

  if (!finalData) return null;

  const { finalLeaderboard } = finalData;
  const medals = ['🥇', '🥈', '🥉'];

  const playAgain = () => socket.emit('game:start');

  return (
    <div className={styles.endScreen}>
      <h2 className={styles.endTitle}>Game Over!</h2>
      <div className={styles.podium}>
        {finalLeaderboard.slice(0, 3).map((p, i) => (
          <div key={p.socketId} className={`${styles.podiumSlot} ${styles[`place${i + 1}`]}`}>
            <div className={styles.medal}>{medals[i] || ''}</div>
            <div className={styles.podiumName}>{p.name}</div>
            <div className={styles.podiumScore}>{p.score} pts</div>
          </div>
        ))}
      </div>
      <div className={styles.fullBoard}>
        {finalLeaderboard.map((p, i) => (
          <div key={p.socketId} className={styles.endRow}>
            <span className={styles.endRank}>#{i + 1}</span>
            <span className={styles.endName}>{p.name}</span>
            <span className={styles.endScore}>{p.score} pts</span>
          </div>
        ))}
      </div>
      {isHost && (
        <button className="btn-primary" onClick={playAgain} style={{ marginTop: '1.5rem' }}>
          Play Again
        </button>
      )}
    </div>
  );
}
