'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { TrackOptionDto } from '@/sdk';
import { api } from '@/sdk/client';
import { queryKeys } from '@/lib/queryKeys';
import { MIN_QUERY_LENGTH, DEBOUNCE_MS } from '../../consts/consts';
import { useDebouncedValue } from '../useDebouncedValue';

/**
 * Hook for Spotify track search (game guess dropdown).
 * Uses TanStack Query with a debounced query key for automatic caching,
 * deduplication, and stale-while-revalidate behavior.
 */
export function useSpotifyTrackSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<TrackOptionDto | null>(
    null,
  );
  const searchRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebouncedValue(searchQuery.trim(), DEBOUNCE_MS);

  const { data: filteredTracks = [], isLoading: queryLoading } = useQuery({
    queryKey: queryKeys.search.tracks(debouncedQuery),
    queryFn: () => api.searchControllerSearchTracks({ q: debouncedQuery }),
    enabled: debouncedQuery.length >= MIN_QUERY_LENGTH,
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  // Show loading during debounce delay too, so the UI doesn't flash "No songs found"
  const trimmed = searchQuery.trim();
  const isDebouncing =
    trimmed !== debouncedQuery && trimmed.length >= MIN_QUERY_LENGTH;
  const isLoading = queryLoading || isDebouncing;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTrack = useCallback((track: TrackOptionDto) => {
    setSelectedTrack(track);
    setSearchQuery('');
    setShowDropdown(false);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedTrack(null);
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    showDropdown,
    setShowDropdown,
    selectedTrack,
    filteredTracks,
    isLoading,
    searchRef,
    handleSelectTrack,
    handleClearSelection,
  };
}
