'use client';

import { useState, useEffect, useRef } from 'react';

export function useScrollDirection(threshold = 10) {
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [isAtTop, setIsAtTop] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setIsAtTop(y < 10);
      if (Math.abs(y - lastY.current) >= threshold) {
        setDirection(y > lastY.current ? 'down' : 'up');
        lastY.current = y;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return { direction, isAtTop };
}
