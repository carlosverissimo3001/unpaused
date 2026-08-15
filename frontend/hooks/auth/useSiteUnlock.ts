'use client';

import { useState } from 'react';

/** Sets the httpOnly access cookie. Shared by the gate page and the invite form. */
export function useSiteUnlock() {
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  async function unlock(password: string): Promise<boolean> {
    setError(false);
    setPending(true);
    try {
      const res = await fetch('/api/auth/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError(true);
        return false;
      }
      return true;
    } catch {
      setError(true);
      return false;
    } finally {
      setPending(false);
    }
  }

  return { unlock, error, pending, clearError: () => setError(false) };
}
