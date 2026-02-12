'use client';

import { useState, useCallback } from 'react';

/**
 * Hook to manage playlist filter state
 * Encapsulates includePrivate and onlyUserOwned filter logic
 */
export function usePlaylistFilters() {
  const [onlyPublic, setOnlyPublic] = useState(false);
  const [onlyUserOwned, setOnlyUserOwned] = useState(false);

  const clearFilters = useCallback(() => {
    setOnlyPublic(false);
    setOnlyUserOwned(true);
  }, []);

  return {
    onlyPublic,
    onlyUserOwned,
    setOnlyPublic,
    setOnlyUserOwned,
    clearFilters,
  };
}
