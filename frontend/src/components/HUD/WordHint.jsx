// src/components/HUD/WordHint.jsx
import useGameStore from '../../store/useGameStore';
import styles from './HUD.module.css';

export default function WordHint() {
  const { round } = useGameStore();
  const isDrawer = useGameStore((s) => s.isDrawer());

  if (isDrawer && round.word) {
    return (
      <div className={styles.wordWrap}>
        <span className={styles.wordLabel}>Draw:</span>
        <span className={styles.wordActual}>{round.word}</span>
      </div>
    );
  }

  if (!round.wordHint) return <div className={styles.wordWrap}><span className={styles.wordLabel}>Waiting for word...</span></div>;

  return (
    <div className={styles.wordWrap}>
      <span className={styles.hintChars}>
        {round.wordHint.split(' ').map((ch, i) => (
          <span key={i} className={ch === '_' ? styles.blank : styles.revealed}>
            {ch === '_' ? '_' : ch}
          </span>
        ))}
      </span>
    </div>
  );
}
