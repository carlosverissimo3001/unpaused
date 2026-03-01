'use client';

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'unpaused:volume';
const DEFAULT_VOLUME = 0.8;

export function useVolume() {
  const [volume, setVolume] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_VOLUME;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null ? Number(stored) : DEFAULT_VOLUME;
  });

  const updateVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolume(clamped);
    localStorage.setItem(STORAGE_KEY, String(clamped));
  }, []);

  return { volume, setVolume: updateVolume };
}
