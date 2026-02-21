// src/hooks/useTimer.js
// Smoothly interpolates between server ticks using requestAnimationFrame.
// Never drives game logic — cosmetic display only.

import { useEffect, useRef, useState } from 'react';
import useGameStore from '../store/useGameStore';

export function useTimer() {
  const serverTimeLeft = useGameStore((s) => s.round.timeLeft);
  const status = useGameStore((s) => s.status);

  const [display, setDisplay] = useState(serverTimeLeft);
  const lastTickAt = useRef(Date.now());
  const lastServerValue = useRef(serverTimeLeft);
  const rafRef = useRef(null);

  // Sync when server tick arrives
  useEffect(() => {
    lastTickAt.current = Date.now();
    lastServerValue.current = serverTimeLeft;
    setDisplay(serverTimeLeft);
  }, [serverTimeLeft]);

  // rAF interpolation loop
  useEffect(() => {
    if (status !== 'drawing') {
      setDisplay(serverTimeLeft);
      return;
    }

    const tick = () => {
      const elapsed = (Date.now() - lastTickAt.current) / 1000;
      const interpolated = Math.max(0, lastServerValue.current - elapsed);
      // Snap if drifted more than 1s
      setDisplay(Math.abs(interpolated - lastServerValue.current) > 1
        ? lastServerValue.current
        : interpolated
      );
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [status, serverTimeLeft]);

  return Math.ceil(display);
}
