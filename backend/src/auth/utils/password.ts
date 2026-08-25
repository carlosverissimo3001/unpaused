import * as crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt) as (
  password: crypto.BinaryLike,
  salt: crypto.BinaryLike,
  keylen: number,
  options: crypto.ScryptOptions,
) => Promise<Buffer>;

/**
 * scrypt rather than argon2 or bcrypt: it is in node's standard library, so
 * there is no native module for the deploy to build.
 */
const SCHEME = 'scrypt';
const SALT_BYTES = 16;
const KEY_BYTES = 64;

/** OWASP's floor for scrypt. Cost is stored per hash so it can be raised. */
const COST = 2 ** 15;
const BLOCK_SIZE = 8;
const PARALLELISM = 1;

/**
 * scrypt needs roughly 128 * N * r bytes, which the default 32MB limit will not
 * give at this cost.
 */
const MAX_MEMORY = 128 * COST * BLOCK_SIZE * 2;

export const MIN_PASSWORD_LENGTH = 8;

/**
 * The parameters live in the string, so raising the cost later leaves every
 * existing hash verifiable against the cost it was written with.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_BYTES);
  const derived = await scrypt(password.normalize('NFKC'), salt, KEY_BYTES, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELISM,
    maxmem: MAX_MEMORY,
  });

  return [
    SCHEME,
    COST,
    BLOCK_SIZE,
    PARALLELISM,
    salt.toString('base64'),
    derived.toString('base64'),
  ].join('$');
}

/** False for anything malformed rather than throwing: a bad hash is a failed login. */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== SCHEME) {
    return false;
  }

  const [, cost, blockSize, parallelism, salt, expected] = parts;
  const expectedBuffer = Buffer.from(expected, 'base64');

  let derived: Buffer;
  try {
    derived = await scrypt(
      password.normalize('NFKC'),
      Buffer.from(salt, 'base64'),
      expectedBuffer.length,
      {
        N: Number(cost),
        r: Number(blockSize),
        p: Number(parallelism),
        maxmem: 128 * Number(cost) * Number(blockSize) * 2,
      },
    );
  } catch {
    return false;
  }

  // Constant time, so a wrong password cannot be narrowed down by how long the
  // comparison took.
  return (
    derived.length === expectedBuffer.length &&
    crypto.timingSafeEqual(derived, expectedBuffer)
  );
}

/** Case and surrounding space are not what makes an address distinct. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
