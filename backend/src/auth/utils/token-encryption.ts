import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * @returns Encrypted string in format: iv:authTag:ciphertext (all base64)
 */
export function encryptToken(plaintext: string, key: string): string {
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
