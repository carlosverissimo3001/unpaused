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
