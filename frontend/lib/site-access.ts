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
