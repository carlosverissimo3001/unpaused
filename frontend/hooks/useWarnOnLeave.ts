'use client';

import { useEffect } from 'react';

/**
 * Warns the user with a browser-native confirmation dialog
 * when they try to close or navigate away from the page.
 * Only active when `enabled` is true.
 */
export function useWarnOnLeave(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [enabled]);
}
