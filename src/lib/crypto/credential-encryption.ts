import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/** Server-only symmetric key for service-credential passwords (see
 * supabase/migrations/20260728000002_ip_phone_and_service_credentials.sql).
 * Never sent to the client, never stored in Postgres — a database leak alone
 * cannot recover plaintext passwords without this key. Must be a base64
 * string decoding to exactly 32 bytes (AES-256). */
function getKey(): Buffer {
  const key = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!key) throw new Error('CREDENTIAL_ENCRYPTION_KEY is not configured');
  const buf = Buffer.from(key, 'base64');
  if (buf.length !== 32) {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY must be a base64 string decoding to 32 bytes');
  }
  return buf;
}

export interface EncryptedPayload {
  iv: string;
  authTag: string;
  ciphertext: string;
}

export function encryptCredential(plaintext: string): EncryptedPayload {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return {
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
}

export function decryptCredential(payload: EncryptedPayload): string {
  const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(payload.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, 'base64')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}
