'use client';

import { useEffect, useRef } from 'react';

/**
 * Records that a Spotify account has signed in from this browser, so the site
 * password is not asked for again on a later visit. Fires once a tab: the mark
 * is renewed on every visit anyway, and repeating it inside one buys nothing.
 */
export function useSpotifyReturnMark(hasSpotify: boolean): void {
  const marked = useRef(false);

  useEffect(() => {
    if (!hasSpotify || marked.current) return;
    marked.current = true;
    // Nothing on screen depends on this; a failure just means the password is
    // asked for next time, which is where we started.
    void fetch('/api/auth/gate/return', { method: 'POST' }).catch(() => {});
  }, [hasSpotify]);
}
