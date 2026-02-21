// src/hooks/useCanvas.js
import { useRef, useEffect, useCallback, useState } from 'react';
import socket from '../socket/socket';
import { getPointerPos, addCanvasListeners } from './useTouch';

const BATCH_INTERVAL_MS = 16;

export function useDrawingCanvas(isActive) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawing = useRef(false);
  const strokeBuffer = useRef([]);
  const flushTimer = useRef(null);

  const [color, setColor] = useState('#00f5ff');
  const [size, setSize] = useState(6);

  const colorRef = useRef(color);
  const sizeRef = useRef(size);

  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { sizeRef.current = size; }, [size]);

  // ─────────────────────────────────────────────────────────
  // Flush buffered strokes
  // ─────────────────────────────────────────────────────────
  const flush = useCallback(() => {
    if (strokeBuffer.current.length === 0) return;
    strokeBuffer.current.forEach((stroke) => {
      socket.emit('draw:stroke', stroke);
    });
    strokeBuffer.current = [];
  }, []);

  const enqueue = useCallback((stroke) => {
    strokeBuffer.current.push(stroke);
    if (!flushTimer.current) {
      flushTimer.current = setInterval(flush, BATCH_INTERVAL_MS);
    }
  }, [flush]);

  // ─────────────────────────────────────────────────────────
  // Draw single stroke
  // ─────────────────────────────────────────────────────────
  const drawStroke = useCallback((ctx, stroke) => {
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.type === 'start') {
      ctx.beginPath();
      ctx.moveTo(stroke.x, stroke.y);
    } else if (stroke.type === 'move') {
      ctx.lineTo(stroke.x, stroke.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(stroke.x, stroke.y);
    }
  }, []);

  // ─────────────────────────────────────────────────────────
  // Canvas setup + resize + drawing logic
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    if (!isActive) {
      return () => {
        window.removeEventListener('resize', resizeCanvas);
      };
    }

    const onStart = (e) => {
      e.preventDefault();
      isDrawing.current = true;
      const pos = getPointerPos(e, canvas);

      const stroke = {
        type: 'start',
        ...pos,
        color: colorRef.current,
        size: sizeRef.current,
      };

      drawStroke(ctx, stroke);
      enqueue(stroke);
    };

    const onMove = (e) => {
      e.preventDefault();
      if (!isDrawing.current) return;

      const pos = getPointerPos(e, canvas);

      const stroke = {
        type: 'move',
        ...pos,
        color: colorRef.current,
        size: sizeRef.current,
      };

      drawStroke(ctx, stroke);
      enqueue(stroke);
    };

    const onEnd = (e) => {
      e.preventDefault();
      if (!isDrawing.current) return;

      isDrawing.current = false;
      flush();

      if (flushTimer.current) {
        clearInterval(flushTimer.current);
        flushTimer.current = null;
      }
    };

    const cleanup = addCanvasListeners(canvas, {
      onStart,
      onMove,
      onEnd,
    });

    return () => {
      cleanup();
      window.removeEventListener('resize', resizeCanvas);

      if (flushTimer.current) {
        clearInterval(flushTimer.current);
        flushTimer.current = null;
      }
    };

  }, [isActive, drawStroke, enqueue, flush]);

  // ─────────────────────────────────────────────────────────
  // Clear canvas
  // ─────────────────────────────────────────────────────────
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('draw:clear');
  }, []);

  // ─────────────────────────────────────────────────────────
  // View mode handlers
  // ─────────────────────────────────────────────────────────
  const applyStroke = useCallback((stroke) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    drawStroke(ctx, stroke);
  }, [drawStroke]);

  const applyReplay = useCallback((strokes) => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes.forEach((s) => drawStroke(ctx, s));
  }, [drawStroke]);

  const applyClear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  return {
    canvasRef,
    ctxRef,
    color,
    setColor,
    size,
    setSize,
    clearCanvas,
    applyStroke,
    applyReplay,
    applyClear,
  };
}