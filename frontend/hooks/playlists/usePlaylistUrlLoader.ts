"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { parsePlaylistUrl } from "@/utils/playlist-utils";

/**
 * Hook to manage playlist URL input, validation, and navigation
 * Handles Cmd/Ctrl+K keyboard shortcut for focusing the search input
 */
export function usePlaylistUrlLoader() {
  const router = useRouter();
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleLoad = useCallback(() => {
    setUrlError(null);
    const playlistId = parsePlaylistUrl(playlistUrl);

    if (!playlistId) {
      setUrlError("Invalid Spotify playlist URL or ID");
      return;
    }

    router.push(`/game/${playlistId}`);
  }, [playlistUrl, router]);

  // Handle Cmd/Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Spotify playlist"]');
        if (searchInput instanceof HTMLInputElement) {
          searchInput.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleUrlChange = useCallback((url: string) => {
    setPlaylistUrl(url);
    setUrlError(null);
  }, []);

  return {
    playlistUrl,
    urlError,
    isSearchFocused,
    setPlaylistUrl: handleUrlChange,
    setIsSearchFocused,
    handleLoad,
  };
}
