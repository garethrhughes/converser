import { encrypt, decrypt } from './crypto.util';
import { randomBytes } from 'crypto';

describe('crypto.util', () => {
  const key = randomBytes(32).toString('hex');

  describe('encrypt and decrypt', () => {
    it('should round-trip a plaintext string', () => {
      const plaintext = 'my-secret-google-token-12345';

      const encrypted = encrypt(plaintext, key);
      const decrypted = decrypt(encrypted, key);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertexts for the same plaintext (random IV)', () => {
      const plaintext = 'same-input';

      const encrypted1 = encrypt(plaintext, key);
      const encrypted2 = encrypt(plaintext, key);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should throw on tampered ciphertext', () => {
      const plaintext = 'sensitive-data';
      const encrypted = encrypt(plaintext, key);

      // Tamper with the ciphertext portion
      const parts = encrypted.split(':');
      parts[2] = 'deadbeef' + parts[2]!.slice(8);
      const tampered = parts.join(':');

      expect(() => decrypt(tampered, key)).toThrow();
    });

    it('should throw on invalid format', () => {
      expect(() => decrypt('not-valid-format', key)).toThrow(
        'Invalid encrypted string format',
      );
    });

    it('should throw with wrong key', () => {
      const plaintext = 'secret';
      const encrypted = encrypt(plaintext, key);
      const wrongKey = randomBytes(32).toString('hex');

      expect(() => decrypt(encrypted, wrongKey)).toThrow();
    });
  });
});
