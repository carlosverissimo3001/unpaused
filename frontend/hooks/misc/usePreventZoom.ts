'use client';

import { useEffect } from 'react';

export function PreventZoom() {
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, {
      passive: false,
    });
    document.addEventListener('wheel', handleWheel, { passive: false });

    const handleGesture = (e: Event) => e.preventDefault();
    document.addEventListener('gesturestart', handleGesture, {
      passive: false,
    });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('gesturestart', handleGesture);
    };
  }, []);

  return null;
}
