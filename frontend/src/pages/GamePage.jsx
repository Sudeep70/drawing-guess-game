import useGameStore from '../store/useGameStore';
import DrawingCanvas from '../components/Canvas/DrawingCanvas';
import ViewCanvas from '../components/Canvas/ViewCanvas';
import ChatBox from '../components/Chat/ChatBox';
import Timer from '../components/HUD/Timer';
import WordHint from '../components/HUD/WordHint';
import RoundBadge from '../components/HUD/RoundBadge';
import Leaderboard from '../components/Leaderboard/Leaderboard';
import EndScreen from '../components/Leaderboard/EndScreen';
import WordPicker from '../components/WordPicker';
import styles from './GamePage.module.css';

export default function GamePage() {
  const status = useGameStore((s) => s.status);
  const isDrawer = useGameStore((s) => s.isDrawer());
  const roundEndData = useGameStore((s) => s.roundEndData);

  if (status === 'gameOver') {
    return (
      <div className={styles.page}>
        <EndScreen />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <WordPicker />

      {/* Top HUD bar */}
      <div className={styles.hud}>
        <RoundBadge />
        <WordHint />
        <Timer />
      </div>

      {/* Main area */}
      <div className={styles.main}>

        {/* Canvas Section */}
        <div className={styles.canvasArea}>
          {isDrawer
            ? <DrawingCanvas key="drawer" />
            : <ViewCanvas key="viewer" />
          }
        </div>

        {/* Right panel */}
        <div className={styles.sidePanel}>
          <Leaderboard />
          <div className={styles.chatWrap}>
            <ChatBox />
          </div>
        </div>

      </div>

      {/* Round end overlay */}
      {status === 'roundEnd' && roundEndData && (
        <div className={styles.roundEndOverlay}>
          <div className={styles.roundEndCard}>
            <h3 className={styles.roundEndTitle}>Round Over!</h3>
            <p className={styles.wordReveal}>
              The word was{' '}
              <strong className="neon-text-cyan">
                {roundEndData.word}
              </strong>
            </p>

            <div className={styles.scoreList}>
              {roundEndData.scores
                .sort((a, b) => b.totalScore - a.totalScore)
                .map((s) => (
                  <div key={s.socketId} className={styles.scoreRow}>
                    <span>{s.name}</span>
                    <span className="neon-text-green">
                      {s.totalScore} pts
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}