// src/components/HUD/WordHint.jsx
import useGameStore from '../../store/useGameStore';
import styles from './HUD.module.css';

export default function WordHint() {
  const { round, status } = useGameStore();
  const isDrawer = useGameStore((s) => s.isDrawer());

  // Drawer sees real word
  if (isDrawer && round.word) {
    return (
      <div className={styles.wordWrap}>
        <span className={styles.wordLabel}>Draw:</span>
        <span className={styles.wordActual}>{round.word}</span>
      </div>
    );
  }

  if (!round.wordHint) {
    return (
      <div className={styles.wordWrap}>
        <span className={styles.wordLabel}>Waiting for word...</span>
      </div>
    );
  }

  const lettersOnly = round.wordHint.replace(/ /g, '');
  const letterCount = lettersOnly.length;

  return (
    <div className={styles.wordWrap}>

      {/* New Header */}
      {status === 'drawing' && (
        <div className={styles.guessHeader}>
          GUESS THIS
        </div>
      )}

      {/* Hint Line + Count */}
      <div className={styles.hintRow}>
        <span className={styles.hintChars}>
          {round.wordHint.split(' ').map((ch, i) => (
            <span
              key={i}
              className={ch === '_' ? styles.blank : styles.revealed}
            >
              {ch}
            </span>
          ))}
        </span>

        <span className={styles.letterCount}>
          {letterCount}
        </span>
      </div>

    </div>
  );
}