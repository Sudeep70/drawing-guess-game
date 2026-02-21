// src/components/WordPicker.jsx
import socket from '../socket/socket';
import useGameStore from '../store/useGameStore';
import styles from './WordPicker.module.css';

export default function WordPicker() {
  const wordChoices = useGameStore((s) => s.wordChoices);
  const isDrawer = useGameStore((s) => s.isDrawer());

  if (!isDrawer || wordChoices.length === 0) return null;

  const pick = (word) => socket.emit('round:wordSelected', { word });

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3 className={styles.title}>Choose a word to draw</h3>
        <p className={styles.sub}>You have 15 seconds</p>
        <div className={styles.choices}>
          {wordChoices.map((word) => (
            <button key={word} className={styles.wordBtn} onClick={() => pick(word)}>
              {word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
