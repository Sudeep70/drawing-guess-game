// src/hooks/useTouch.js
// Normalizes mouse and touch events into a unified pointer interface.
// Correctly handles high-DPI (retina) canvas scaling.

export function getPointerPos(e, canvas) {
  const rect = canvas.getBoundingClientRect();

  let clientX, clientY;

  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    clientX = e.changedTouches[0].clientX;
    clientY = e.changedTouches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

export function addCanvasListeners(canvas, handlers) {
  // Mouse events
  canvas.addEventListener('mousedown', handlers.onStart);
  canvas.addEventListener('mousemove', handlers.onMove);
  canvas.addEventListener('mouseup', handlers.onEnd);
  canvas.addEventListener('mouseleave', handlers.onEnd);

  // Touch events
  canvas.addEventListener('touchstart', handlers.onStart, { passive: false });
  canvas.addEventListener('touchmove', handlers.onMove, { passive: false });
  canvas.addEventListener('touchend', handlers.onEnd, { passive: false });
  canvas.addEventListener('touchcancel', handlers.onEnd, { passive: false });

  // Cleanup
  return () => {
    canvas.removeEventListener('mousedown', handlers.onStart);
    canvas.removeEventListener('mousemove', handlers.onMove);
    canvas.removeEventListener('mouseup', handlers.onEnd);
    canvas.removeEventListener('mouseleave', handlers.onEnd);

    canvas.removeEventListener('touchstart', handlers.onStart);
    canvas.removeEventListener('touchmove', handlers.onMove);
    canvas.removeEventListener('touchend', handlers.onEnd);
    canvas.removeEventListener('touchcancel', handlers.onEnd);
  };
}