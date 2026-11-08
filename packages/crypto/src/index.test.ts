import { describe, expect, it } from 'vitest';
import {
  CRYPTO_BLOB_VERSION,
  CRYPTO_IV_LENGTH,
  CRYPTO_TAG_LENGTH,
  createAes256Gcm,
  createCryptoFromEnv,
  DEV_CRYPTO_KEY_HEX,
  decryptUtf8,
  encryptUtf8,
} from './index.js';

/** version=1, 12-byte IV 000102…0b, AES-256-GCM of "hello ysk" with DEV_CRYPTO_KEY_HEX */
const GOLDEN_V1_HEX =
  '01000102030405060708090a0b31c53e1b0acbd72da5887b498c6766d29eee5fb00cc4448fd3';

describe('crypto', () => {
  it('roundtrips utf8', async () => {
    const port = createAes256Gcm(DEV_CRYPTO_KEY_HEX);
    const blob = await encryptUtf8(port, 'hello ysk');
    await expect(decryptUtf8(port, blob)).resolves.toBe('hello ysk');
  });

  it('rejects tampered ciphertext', async () => {
    const port = createAes256Gcm(DEV_CRYPTO_KEY_HEX);
    const blob = await port.encrypt(new TextEncoder().encode('hi'));
    const last = blob.length - 1;
    const value = blob[last];
    if (value === undefined) throw new Error('empty ciphertext');
    blob[last] = value ^ 0xff;
    await expect(port.decrypt(blob)).rejects.toThrow();
  });

  it('requires a master key in production', () => {
    expect(() => createCryptoFromEnv({ NODE_ENV: 'production' })).toThrow(/CRYPTO_MASTER_KEY/);
  });

  it('decrypts the version-1 golden blob', async () => {
    const port = createAes256Gcm(DEV_CRYPTO_KEY_HEX);
    const blob = Buffer.from(GOLDEN_V1_HEX, 'hex');
    expect(blob[0]).toBe(CRYPTO_BLOB_VERSION);
    expect(blob.length).toBeGreaterThan(1 + CRYPTO_IV_LENGTH + CRYPTO_TAG_LENGTH);
    await expect(decryptUtf8(port, blob)).resolves.toBe('hello ysk');
  });
});
