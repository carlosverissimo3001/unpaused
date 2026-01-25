/**
 * Centralized query keys factory for consistent cache invalidation
 * Follows TanStack Query best practices for hierarchical keys
 */
export const queryKeys = {
  // Game-related queries
  game: {
    all: ["game"] as const,
    session: (sessionId: string) => ["game", "session", sessionId] as const,
    state: (sessionId: string) => ["game", "session", sessionId, "state"] as const,
  },
  // Playlist-related queries
  playlists: {
    all: ["playlists"] as const,
    me: (params?: { limit?: number; offset?: number; includePrivate?: boolean; onlyUserOwned?: boolean }) =>
      ["playlists", "me", params] as const,
    detail: (playlistId: string) => ["playlists", playlistId] as const,
  },
  // Auth-related queries
  auth: {
    all: ["auth"] as const,
    me: ["auth", "me"] as const,
  },
} as const;
