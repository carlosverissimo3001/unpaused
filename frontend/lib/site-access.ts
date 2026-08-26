const LABEL = 'site-access:v1';

const COOKIE_NAME = 'site-access';

export { COOKIE_NAME as SITE_ACCESS_COOKIE };

const encoder = new TextEncoder();

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const bytes = new Uint8Array(sig);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function getExpectedToken(): Promise<string | null> {
  const password = process.env.SITE_PASSWORD;
  if (!password) return null;
  return hmacSha256Hex(password, LABEL);
}

export async function isAccessTokenValid(
  cookieValue: string | null | undefined,
): Promise<boolean> {
  if (!cookieValue) return false;
  const expected = await getExpectedToken();
  if (!expected) return false;
  return constantTimeEqual(cookieValue, expected);
}

const RETURN_LABEL = 'spotify-return:v1';

const RETURN_COOKIE_NAME = 'spotify-return';

export { RETURN_COOKIE_NAME as SPOTIFY_RETURN_COOKIE };

/** A year. The visitor this exists for has been away for months. */
export const SITE_ACCESS_MAX_AGE = 60 * 60 * 24 * 365;

function base64Url(value: string): string {
  const bytes = encoder.encode(value);
  let binary = '';
  for (let i = 0; i < bytes.length; i++)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(value: string): string | null {
  try {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/**
 * Marks a browser as one a Spotify account has signed in from. Carries the id
 * rather than being opaque: the proxy runs at the edge and cannot ask anyone
 * who this is, so anything it needs to decide has to travel in the cookie.
 */
export async function signSpotifyReturnToken(
  spotifyUserId: string,
): Promise<string | null> {
  const password = process.env.SITE_PASSWORD;
  if (!password || !spotifyUserId) return null;
  const encoded = base64Url(spotifyUserId);
  const sig = await hmacSha256Hex(password, `${RETURN_LABEL}:${encoded}`);
  return `${encoded}.${sig}`;
}

/** The Spotify id the cookie vouches for, or null if it vouches for nothing. */
export async function readSpotifyReturnToken(
  cookieValue: string | null | undefined,
): Promise<string | null> {
  if (!cookieValue) return null;
  const password = process.env.SITE_PASSWORD;
  if (!password) return null;

  const separator = cookieValue.lastIndexOf('.');
  if (separator <= 0) return null;
  const encoded = cookieValue.slice(0, separator);
  const sig = cookieValue.slice(separator + 1);

  const expected = await hmacSha256Hex(password, `${RETURN_LABEL}:${encoded}`);
  if (!constantTimeEqual(sig, expected)) return null;

  return fromBase64Url(encoded);
}
