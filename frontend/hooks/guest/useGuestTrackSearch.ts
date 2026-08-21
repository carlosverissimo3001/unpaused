'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { TrackOptionDto } from '@/sdk';
import { api } from '@/sdk/client';
import { queryKeys } from '@/lib/queryKeys';
import { MIN_QUERY_LENGTH, DEBOUNCE_MS } from '../../consts/consts';
import { useDebouncedValue } from '../useDebouncedValue';

/**
 * Guest equivalent of useSpotifyTrackSearch: identical shape (so GuessInput
 * can be reused as-is), but hits the public /guest/search endpoint instead
 * of the session-authenticated one.
 */
export function useGuestTrackSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<TrackOptionDto | null>(
    null,
  );
  const searchRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebouncedValue(searchQuery.trim(), DEBOUNCE_MS);

  const { data: filteredTracks = [], isLoading: queryLoading } = useQuery({
    queryKey: queryKeys.guest.search(debouncedQuery),
    queryFn: () => api.guestSearchControllerSearchTracks({ q: debouncedQuery }),
    enabled: debouncedQuery.length >= MIN_QUERY_LENGTH,
    staleTime: 2 * 60 * 1000,
  });

  const trimmed = searchQuery.trim();
  const isDebouncing =
    trimmed !== debouncedQuery && trimmed.length >= MIN_QUERY_LENGTH;
  const isLoading = queryLoading || isDebouncing;

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
