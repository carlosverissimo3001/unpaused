'use client';

import { useState, useCallback } from 'react';
import { PlaylistControllerGetMyPlaylistsSortByEnum as SortByValues } from '@/sdk';

export type Visibility = 'all' | 'public' | 'private';

/**
 * Hook to manage playlist filter state
 */
export function usePlaylistFilters() {
  const [visibility, setVisibility] = useState<Visibility>('all');
  const [sortBy, setSortBy] = useState<SortByValues>(SortByValues.Default);

  const clearFilters = useCallback(() => {
    setVisibility('all');
    setSortBy(SortByValues.Default);
  }, []);

  const hasActiveFilters =
    visibility !== 'all' || sortBy !== SortByValues.Default;

  return {
    visibility,
    setVisibility,
    sortBy,
    setSortBy,
    clearFilters,
    hasActiveFilters,
  };
}
