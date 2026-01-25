"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import type { TrackOptionDto } from "@/sdk";

/**
 * Utility function for fuzzy string matching
 */
function getSimilarity(s1: string, s2: string): number {
  const pairify = (s: string) => {
    const pairs = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) {
      pairs.add(s.slice(i, i + 2));
    }
    return pairs;
  };
  const pairs1 = pairify(s1.toLowerCase());
  const pairs2 = pairify(s2.toLowerCase());
  const intersection = [...pairs1].filter((p) => pairs2.has(p)).length;
  return (2.0 * intersection) / (pairs1.size + pairs2.size);
}

/**
 * Hook for managing track search UI state and filtering
 * Pure UI state management - no server state
 */
export function useTrackSearch(trackOptions: TrackOptionDto[] = []) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<TrackOptionDto | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Filter tracks based on search query
  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return [];
    if (!trackOptions || trackOptions.length === 0) return [];

    const query = searchQuery.toLowerCase().trim();
    const queryWords = query.split(/\s+/).filter(word => word.length > 0);

    return trackOptions
      .filter((track) => track && track.name && track.artist) // Filter out invalid tracks
      .map((track) => {
        const name = (track.name || "").toLowerCase();
        const artist = (track.artist || "").toLowerCase();
        const fullText = `${name} ${artist}`;

        // 1. Check for exact word inclusion first (High priority)
        const exactMatch = queryWords.length > 0 && queryWords.every((word) => fullText.includes(word));

        // 2. Check for fuzzy similarity (Lower priority fallback)
        const similarity = getSimilarity(query, fullText);
        const isFuzzyMatch = similarity > 0.4; // Lowered threshold from 0.45 to 0.4

        // 3. Check for partial matches (even more lenient)
        const partialMatch = query.length >= 2 && (
          name.includes(query) || 
          artist.includes(query) ||
          fullText.includes(query)
        );

        // Calculate final score for sorting
        let score = similarity;
        if (exactMatch) score += 2; // Boost exact matches
        if (name.startsWith(query)) score += 1.5; // Boost title matches
        if (partialMatch) score += 0.5; // Boost partial matches

        return { track, matches: exactMatch || isFuzzyMatch || partialMatch, score };
      })
      .filter((item) => item.matches)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.track)
      .slice(0, 8);
  }, [searchQuery, trackOptions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectTrack = (track: TrackOptionDto) => {
    setSelectedTrack(track);
    setSearchQuery("");
    setShowDropdown(false);
  };

  const handleClearSelection = () => {
    setSelectedTrack(null);
    setSearchQuery("");
  };

  return {
    searchQuery,
    setSearchQuery,
    showDropdown,
    setShowDropdown,
    selectedTrack,
    filteredTracks,
    searchRef,
    handleSelectTrack,
    handleClearSelection,
  };
}
