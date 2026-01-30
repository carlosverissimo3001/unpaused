import { GameStateDto, GameStateDtoStatusEnum, GuessResultDto } from "../sdk";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface User {
  id: string;
  spotifyId: string;
  displayName: string;
  email?: string;
  isTrusted: boolean;
}


export interface PlaylistSummary {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string;
  owner: string;
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

export async function tokenLogin(
  accessToken: string,
  refreshToken?: string
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/token-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ accessToken, refreshToken }),
    });
    return res.ok;
  } catch {
    return false;
  }
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

export interface Track {
  id: string;
  name: string;
  artists: string[];
  albumName: string;
  imageUrl: string;
  durationMs: number;
  previewUrl: string | null;
  externalUrl: string;
  isPlayable: boolean;
  primaryArtist: string;
  popularity: number;
  isExplicit: boolean;
}

export interface PlaylistTrack {
  addedAt: string;
  track: Track;
}
export interface User {
  spotifyUserId: string;
  displayName: string;
  isTrusted: boolean;
}



// Game types
export const ROUND_DURATIONS = [0.1, 0.5, 1, 2, 4, 8];

export interface GuessHistory {
  trackId: string | null;
  trackName: string | null;
  artistName: string | null;
  result: "correct" | "artist" | "wrong" | "skip";
}


// Game API functions
export async function startGame(playlistId: string): Promise<GameStateDto | null> {
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

export async function getGameState(sessionId: string): Promise<GameStateDto | null> {
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
): Promise<GuessResultDto | null> {
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
