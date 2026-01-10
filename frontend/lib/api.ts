const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface User {
  id: string;
  spotifyId: string;
  displayName: string;
  email?: string;
  isTrusted: boolean;
}

export interface PlaylistImage {
  url: string;
  height?: number;
  width?: number;
}

export interface PlaylistOwner {
  id: string;
  displayName: string;
}

export interface PlaylistSummary {
  id: string;
  name: string;
  description: string | null;
  images: PlaylistImage[];
  owner: PlaylistOwner;
  totalTracks: number;
  public: boolean;
}

export interface PlaylistsResponse {
  items: PlaylistSummary[];
  total: number;
  offset: number;
  limit: number;
}

export async function fetchMe(): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export function getLoginUrl(): string {
  return `${API_BASE}/auth/login`;
}

export function getDevLoginUrl(): string {
  return `${API_BASE}/auth/dev-login`;
}

export async function fetchMyPlaylists(): Promise<PlaylistsResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/playlists/me`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export interface PlaylistDetails {
  id: string;
  name: string;
  description: string;
  images: PlaylistImage[];
  owner: PlaylistOwner;
  tracks: {
    addedAt: string;
    track: {
      id: string;
      name: string;
      artists: { id: string; name: string }[];
      album: {
        id: string;
        name: string;
        images: PlaylistImage[];
      };
      durationMs: number;
      previewUrl: string | null;
      externalUrl?: string;
    };
  }[];
  totalTracks: number;
  public: boolean;
  externalUrl: string;
}

export async function getPlaylistDetails(playlistId: string): Promise<PlaylistDetails> {
  const res = await fetch(`${API_BASE}/playlists/${playlistId}`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch playlist");
  }
  return res.json();
}

export async function fetchPlaylistById(playlistId: string): Promise<PlaylistDetails | null> {
  try {
    const res = await fetch(`${API_BASE}/playlists/${playlistId}`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Game types
export interface TrackOption {
  id: string;
  name: string;
  artist: string;
}

export interface GuessHistory {
  trackId: string;
  trackName: string;
  artistName: string;
  result: "correct" | "artist" | "wrong" | "skip";
}

export interface GameState {
  sessionId: string;
  status: "in_progress" | "won" | "lost";
  currentRound: number;
  previewUrl: string;
  options: TrackOption[];
  guessHistory: GuessHistory[];
  correctTrack?: { id: string; name: string; artist: string };
  alreadyPlayed?: boolean;
}

export interface GuessResult {
  result: "correct" | "artist" | "wrong" | "skip";
  gameState: GameState;
}

export async function startGame(playlistId: string): Promise<GameState> {
  const res = await fetch(`${API_BASE}/game/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ playlistId }),
  });
  if (!res.ok) {
    throw new Error("Failed to start game");
  }
  return res.json();
}

export async function submitGuess(sessionId: string, trackId: string | null): Promise<GuessResult> {
  const res = await fetch(`${API_BASE}/game/${sessionId}/guess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ trackId }),
  });
  if (!res.ok) {
    throw new Error("Failed to submit guess");
  }
  return res.json();
}

export async function getDailyPuzzle(): Promise<GameState> {
  const res = await fetch(`${API_BASE}/game/daily/today`, {
    credentials: "include",
  });
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error("403: Not authorized for daily challenge");
    }
    throw new Error("Failed to get daily puzzle");
  }
  return res.json();
}

export async function submitDailyGuess(trackId: string | null): Promise<GuessResult> {
  const res = await fetch(`${API_BASE}/game/daily/guess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ trackId }),
  });
  if (!res.ok) {
    throw new Error("Failed to submit daily guess");
  }
  return res.json();
}
