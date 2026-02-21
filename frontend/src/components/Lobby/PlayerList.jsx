// src/components/Lobby/PlayerList.jsx
import useGameStore from '../../store/useGameStore';
import styles from './Lobby.module.css';

export default function PlayerList() {
  const players = useGameStore((s) => s.players);
  const mySocketId = useGameStore((s) => s.mySocketId);
  const hostSocketId = useGameStore((s) => s.hostSocketId);

  return (
    <div className={styles.playerList}>
      <div className={styles.listHeader}>Players ({players.length}/6)</div>
      {players.map((p) => (
        <div key={p.socketId} className={`${styles.playerRow} ${p.socketId === mySocketId ? styles.me : ''}`}>
          <div className={styles.avatar}>{p.name[0]?.toUpperCase()}</div>
          <span className={styles.playerName}>{p.name}</span>
          {p.socketId === hostSocketId && <span className={styles.hostBadge}>HOST</span>}
          {p.socketId === mySocketId && <span className={styles.youBadge}>YOU</span>}
        </div>
      ))}
      {/* Empty slots */}
      {Array.from({ length: Math.max(0, 6 - players.length) }).map((_, i) => (
        <div key={`empty-${i}`} className={styles.emptySlot}>Waiting...</div>
      ))}
    </div>
  );
}
