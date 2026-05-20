import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const EXPECTED_KEY_LENGTH = 32;

export function encrypt(plaintext: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');

  if (key.length !== EXPECTED_KEY_LENGTH) {
    throw new Error(
      `Encryption key must be ${EXPECTED_KEY_LENGTH} bytes (${EXPECTED_KEY_LENGTH * 2} hex characters)`,
    );
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  // Format: iv:tag:ciphertext (all hex)
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedString: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');

  if (key.length !== EXPECTED_KEY_LENGTH) {
    throw new Error(
      `Encryption key must be ${EXPECTED_KEY_LENGTH} bytes (${EXPECTED_KEY_LENGTH * 2} hex characters)`,
    );
  }

  const [ivHex, tagHex, ciphertext] = encryptedString.split(':');

  if (!ivHex || !tagHex || !ciphertext) {
    throw new Error('Invalid encrypted string format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
