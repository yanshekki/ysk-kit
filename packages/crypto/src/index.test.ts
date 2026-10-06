import { describe, expect, it } from 'vitest';
import {
  createAes256Gcm,
  createCryptoFromEnv,
  DEV_CRYPTO_KEY_HEX,
  decryptUtf8,
  encryptUtf8,
} from './index.js';

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
});
