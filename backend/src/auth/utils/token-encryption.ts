import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const EXPECTED_KEY_LENGTH = 64;

/**
 * Validates that the encryption key is properly formatted for AES-256-GCM.
 * @param key - Hex-encoded encryption key
 * @throws Error if key is invalid (empty, wrong length, or invalid hex)
 */
function validateEncryptionKey(key: string): void {
  if (!key || key.length === 0) {
    throw new Error(
      'Encryption key is not configured. Please set a valid 32-byte hex-encoded key.',
    );
  }

  if (key.length !== EXPECTED_KEY_LENGTH) {
    throw new Error(
      `Encryption key must be ${EXPECTED_KEY_LENGTH} hex characters (32 bytes). Got ${key.length} characters.`,
    );
  }

  if (!/^[0-9a-fA-F]+$/.test(key)) {
    throw new Error(
      'Encryption key must be a valid hex string (only 0-9 and a-f characters).',
    );
  }
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * @returns Encrypted string in format: iv:authTag:ciphertext (all base64)
 */
export function encryptToken(plaintext: string, key: string): string {
  validateEncryptionKey(key);
  const keyBuffer = Buffer.from(key, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypts an encrypted string produced by encryptToken.
 * @param encrypted - String in format: iv:authTag:ciphertext (all base64)
 * @returns Decrypted plaintext
 */
export function decryptToken(encrypted: string, key: string): string {
  validateEncryptionKey(key);
  const parts = encrypted.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }

  const [ivB64, authTagB64, ciphertext] = parts;
  const keyBuffer = Buffer.from(key, 'hex');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
