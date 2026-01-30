"use client";

import { useState, useCallback } from "react";

/**
 * Hook to manage playlist filter state
 * Encapsulates includePrivate and onlyUserOwned filter logic
 */
export function usePlaylistFilters() {
  const [includePrivate, setIncludePrivate] = useState(false);
  const [onlyUserOwned, setOnlyUserOwned] = useState(false);

  const clearFilters = useCallback(() => {
    setIncludePrivate(false);
    setOnlyUserOwned(true);
  }, []);

  return {
    includePrivate,
    onlyUserOwned,
    setIncludePrivate,
    setOnlyUserOwned,
    clearFilters,
  };
}
