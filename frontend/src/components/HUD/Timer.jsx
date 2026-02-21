// src/components/HUD/Timer.jsx
import { useTimer } from '../../hooks/useTimer';
import styles from './HUD.module.css';

const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function Timer() {
  const timeLeft = useTimer();
  const total = 60;
  const fraction = Math.max(0, Math.min(1, timeLeft / total));
  const dashOffset = CIRCUMFERENCE * (1 - fraction);

  const color = timeLeft > 20 ? 'var(--neon-cyan)' : timeLeft > 10 ? 'var(--neon-yellow)' : '#ff4444';

  return (
    <div className={styles.timerWrap}>
      <svg width={56} height={56} viewBox="0 0 56 56">
        <circle cx={28} cy={28} r={RADIUS} fill="none" stroke="var(--surface-3)" strokeWidth={4} />
        <circle
          cx={28} cy={28} r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
          style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s', filter: `drop-shadow(0 0 4px ${color})` }}
        />
        <text x={28} y={33} textAnchor="middle" fill={color} fontSize={14} fontWeight="bold" fontFamily="var(--font)">
          {timeLeft}
        </text>
      </svg>
    </div>
  );
}
