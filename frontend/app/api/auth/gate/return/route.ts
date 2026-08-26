import { NextResponse } from 'next/server';
import {
  SITE_ACCESS_MAX_AGE,
  SPOTIFY_RETURN_COOKIE,
  signSpotifyReturnToken,
} from '@/lib/site-access';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Marks this browser as one a Spotify account has signed in from, so a visitor
 * who comes back after the site password has expired is not sent away from the
 * flow she has already completed.
 *
 * The caller supplies nothing. Who this is comes from the backend, asked with
 * the caller's own session cookie, so the mark cannot be minted by asking for
 * it.
 */
export async function POST(request: Request) {
  const cookie = request.headers.get('cookie');
  if (!cookie) {
    return NextResponse.json({ marked: false });
  }

  let spotifyUserId: string | undefined;
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { cookie },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ marked: false });
    const me = (await res.json()) as { spotifyUserId?: string };
    spotifyUserId = me.spotifyUserId;
  } catch {
    return NextResponse.json({ marked: false });
  }

  if (!spotifyUserId) {
    return NextResponse.json({ marked: false });
  }

  const token = await signSpotifyReturnToken(spotifyUserId);
  if (!token) {
    return NextResponse.json({ marked: false });
  }

  const response = NextResponse.json({ marked: true });
  response.cookies.set(SPOTIFY_RETURN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    maxAge: SITE_ACCESS_MAX_AGE,
  });
  return response;
}
