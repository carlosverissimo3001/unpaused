import * as crypto from 'crypto';

const TOKEN_BYTES = 32;

/**
 * The value that goes in the link, and the digest that goes in the table.
 *
 * SHA-256 rather than the password KDF: this is 256 bits from the system CSPRNG,
 * so there is no guessing to slow down and nothing a work factor would buy. The
 * hash exists so a leaked table is not a pile of working links.
 */
export function createAuthToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(TOKEN_BYTES).toString('base64url');
  return { token, tokenHash: hashAuthToken(token) };
}

export function hashAuthToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Keys a rate limit to an address without writing the address down. A Redis
 * keyspace full of emails is a readable list of this site's users, sitting
 * next to the sessions.
 */
export function emailFingerprint(email: string): string {
  return crypto.createHash('sha256').update(email).digest('hex').slice(0, 32);
}
