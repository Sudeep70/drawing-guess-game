// src/components/Canvas/DrawingCanvas.jsx
import { useEffect, useCallback } from 'react';
import { useDrawingCanvas } from '../../hooks/useCanvas';
import styles from './Canvas.module.css';

const COLORS = [
  '#ffffff', '#000000', '#ff0000', '#ff8800', '#ffff00',
  '#00ff00', '#00f5ff', '#0044ff', '#ff00c8', '#bf00ff',
  '#8B4513', '#888888',
];

export default function DrawingCanvas() {
  const {
    canvasRef, color, setColor, size, setSize, clearCanvas,
  } = useDrawingCanvas(true);

  const handleSizeChange = useCallback((e) => {
    setSize(Number(e.target.value));
  }, [setSize]);

  return (
    <div className={styles.wrapper}>
     <canvas
  ref={canvasRef}
  className={styles.canvas}
/>
      <div className={styles.toolbar}>
        <div className={styles.colorPalette}>
          {COLORS.map((c) => (
            <button
              key={c}
              className={`${styles.colorSwatch} ${color === c ? styles.activeColor : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
        <div className={styles.sizeControl}>
          <span className={styles.toolLabel}>Size</span>
          <input
            type="range"
            min={2}
            max={40}
            value={size}
            onChange={handleSizeChange}
            className={styles.slider}
          />
          <div
            className={styles.sizePreview}
            style={{ width: size, height: size, background: color }}
          />
        </div>
        <button className={styles.clearBtn} onClick={clearCanvas}>
          🗑 Clear
        </button>
      </div>
    </div>
  );
}
