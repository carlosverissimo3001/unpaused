"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { TrackOptionDto } from "@/sdk";
import { api } from "@/sdk/client";

const DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

/**
 * Hook for Spotify track search (game guess dropdown).
 * Calls GET /search/tracks via SDK as the user types (debounced).
 */
export function useSpotifyTrackSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<TrackOptionDto | null>(null);
  const [filteredTracks, setFilteredTracks] = useState<TrackOptionDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setFilteredTracks([]);
      setIsLoading(false);
      return;
    }

    // Show loading immediately while debouncing or fetching (avoids brief "No songs found")
    setIsLoading(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      api
        .searchControllerSearchTracks({ q: trimmed })
        .then((results) => setFilteredTracks(results ?? []))
        .catch(() => setFilteredTracks([]))
        .finally(() => setIsLoading(false));
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectTrack = useCallback((track: TrackOptionDto) => {
    setSelectedTrack(track);
    setSearchQuery("");
    setShowDropdown(false);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedTrack(null);
    setSearchQuery("");
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
