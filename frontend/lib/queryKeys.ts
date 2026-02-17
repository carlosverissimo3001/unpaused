/**
 * Centralized query keys factory for consistent cache invalidation
 * Follows TanStack Query best practices for hierarchical keys
 */
export const queryKeys = {
  // Game-related queries
  game: {
    all: ['game'] as const,
    /** Cache-only: set by start-game onSuccess so remounted component sees sessionId and re-renders */
    startedSessionForPlaylist: (playlistId: string) =>
      ['game', 'startedSession', 'playlist', playlistId] as const,
    startedSessionForDaily: ['game', 'startedSession', 'daily'] as const,
    session: (sessionId: string) => ['game', 'session', sessionId] as const,
    state: (sessionId: string) =>
      ['game', 'session', sessionId, 'state'] as const,
    history: (params?: {
      mode?: string;
      page?: number;
      limit?: number;
      search?: string;
      status?: string[];
      from?: string;
      to?: string;
    }) => ['game', 'history', params] as const,
    stats: ['game', 'stats'] as const,
    playedToday: ['game', 'playedToday'] as const,
    share: (gameId: string) => ['game', 'share', gameId] as const,
  },
  // Playlist-related queries
  playlists: {
    all: ['playlists'] as const,
    me: (params?: {
      limit?: number;
      offset?: number;
      onlyPublic?: boolean;
      onlyUserOwned?: boolean;
    }) => ['playlists', 'me', params] as const,
    detail: (playlistId: string) => ['playlists', playlistId] as const,
  },
  // Auth-related queries
  auth: {
    all: ['auth'] as const,
    me: ['auth', 'me'] as const,
  },
  // Streak queries
  streak: {
    all: ['streak'] as const,
    status: ['streak', 'status'] as const,
    quiz: ['streak', 'quiz'] as const,
  },
  // Admin queries
  admin: {
    all: ['admin'] as const,
    streakQuestions: ['admin', 'streakQuestions'] as const,
  },
  // Daily game queries
  daily: {
    all: ['daily'] as const,
    today: ['daily', 'today'] as const,
    stats: ['daily', 'stats'] as const,
    history: (params?: { limit?: number; offset?: number }) =>
      ['daily', 'history', params] as const,
    share: (gameId: string) => ['daily', 'share', gameId] as const,
  },
} as const;
