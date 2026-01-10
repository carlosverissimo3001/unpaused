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


export interface User {
  spotifyUserId: string;
  displayName: string;
  isTrusted: boolean;
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
  externalUrl: string;
}

export interface PlaylistsResponse {
  items: PlaylistSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface Artist {
  id: string;
  name: string;
}

export interface Album {
  id: string;
  name: string;
  images: PlaylistImage[];
}

export interface Track {
  id: string;
  name: string;
  artists: Artist[];
  album: Album;
  durationMs: number;
  externalUrl: string;
  previewUrl: string | null;
  isPlayable: boolean;
}

export interface PlaylistTrack {
  track: Track;
  addedAt: string;
}


// Game types
export const ROUND_DURATIONS = [0.1, 0.5, 1, 2, 4, 8];

export interface TrackOption {
  id: string;
  name: string;
  artist: string;
}

export interface GuessHistory {
  trackId: string | null;
  trackName: string | null;
  artistName: string | null;
  result: "correct" | "artist" | "wrong" | "skip";
}

export interface GameState {
  sessionId: string;
  currentRound: number;
  snippetDuration: number;
  status: "playing" | "won" | "lost";
  guesses: GuessHistory[];
  previewUrl: string | null;
  trackOptions: TrackOption[];
  answer: TrackOption | null;
}

export interface GuessResult {
  result: "correct" | "artist" | "wrong" | "skip";
  gameOver: boolean;
  status: "playing" | "won" | "lost";
  currentRound: number;
  snippetDuration: number;
}

export interface DailyState extends GameState {
  date: string;
  playlistName: string;
  alreadyPlayed: boolean;
  previousResult: {
    guesses: GuessHistory[];
    score: number;
    wonAt: number | null;
  } | null;
}

// Game API functions
export async function startGame(playlistId: string): Promise<GameState | null> {
  try {
    const res = await fetch(`${API_BASE}/game/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ playlistId }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getGameState(sessionId: string): Promise<GameState | null> {
  try {
    const res = await fetch(`${API_BASE}/game/${sessionId}`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function submitGuess(
  sessionId: string,
  trackId: string | null,
  skip = false
): Promise<GuessResult | null> {
  try {
    const res = await fetch(`${API_BASE}/game/${sessionId}/guess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ trackId, skip }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getDailyPuzzle(): Promise<DailyState | null> {
  try {
    const res = await fetch(`${API_BASE}/game/daily/today`, {
      credentials: "include",
    });
    if (!res.ok) {
      console.error(`Failed to load daily puzzle: ${res.status} ${res.statusText}`);
      return null;
    }
    return res.json();
  } catch (error) {
    console.error("Error loading daily puzzle:", error);
    return null;
  }
}

export async function submitDailyGuess(
  trackId: string | null,
  skip = false
): Promise<GuessResult | null> {
  try {
    const res = await fetch(`${API_BASE}/game/daily/guess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ trackId, skip }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}


