// src/components/Canvas/ViewCanvas.jsx
import { useEffect } from 'react';
import socket from '../../socket/socket';
import { useDrawingCanvas } from '../../hooks/useCanvas';
import styles from './Canvas.module.css';

export default function ViewCanvas() {
  const { canvasRef, applyStroke, applyReplay, applyClear } = useDrawingCanvas(false);

  useEffect(() => {
    socket.on('draw:stroke', applyStroke);
    socket.on('draw:clear', applyClear);
    socket.on('draw:replay', ({ strokes }) => applyReplay(strokes));

    return () => {
      socket.off('draw:stroke', applyStroke);
      socket.off('draw:clear', applyClear);
      socket.off('draw:replay');
    };
  }, [applyStroke, applyReplay, applyClear]);

  return (
    <div className={styles.wrapper}>
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className={styles.canvas}
        style={{ cursor: 'default', pointerEvents: 'none' }}
      />
      <div className={styles.viewingLabel}>👁 Watching...</div>
    </div>
  );
}
