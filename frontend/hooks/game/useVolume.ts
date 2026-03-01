'use client';

import { useState, useCallback } from 'react';
import { DEFAULT_VOLUME } from '@/consts/consts';

const STORAGE_KEY = 'unpaused:volume';

export function useVolume() {
  const [volume, setVolume] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_VOLUME;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return DEFAULT_VOLUME;
    const parsed = Number(stored);
    return isNaN(parsed) || parsed < 0 || parsed > 1 ? DEFAULT_VOLUME : parsed;
  });

  const updateVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolume(clamped);
    localStorage.setItem(STORAGE_KEY, String(clamped));
  }, []);

  return { volume, setVolume: updateVolume };
}
