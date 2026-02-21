// src/components/HUD/RoundBadge.jsx
import useGameStore from '../../store/useGameStore';
import styles from './HUD.module.css';

export default function RoundBadge() {
  const { round } = useGameStore();
  return (
    <div className={styles.roundBadge}>
      <span className={styles.roundNum}>{round.current}</span>
      <span className={styles.roundSep}>/</span>
      <span className={styles.roundTotal}>{round.total}</span>
    </div>
  );
}
