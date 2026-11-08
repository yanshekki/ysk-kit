import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

export const CRYPTO_BLOB_VERSION = 1;
export const CRYPTO_IV_LENGTH = 12;
export const CRYPTO_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export interface ICryptoPort {
  encrypt(plain: Uint8Array): Promise<Uint8Array>;
  decrypt(cipher: Uint8Array): Promise<Uint8Array>;
}

const parseKey = (hex: string): Buffer => {
  const key = Buffer.from(hex, 'hex');
  if (key.length !== KEY_LENGTH) {
    throw new Error('CRYPTO_MASTER_KEY must be 64 hex chars (32 bytes)');
  }
  return key;
};

export const DEV_CRYPTO_KEY_HEX = createHash('sha256').update('ysk-kit-dev-crypto').digest('hex');

export const createAes256Gcm = (masterKeyHex: string): ICryptoPort => {
  const key = parseKey(masterKeyHex);
  return {
    async encrypt(plain) {
      const iv = randomBytes(CRYPTO_IV_LENGTH);
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
      const tag = cipher.getAuthTag();
      return Buffer.concat([Buffer.from([CRYPTO_BLOB_VERSION]), iv, ciphertext, tag]);
    },
    async decrypt(blob) {
      const buf = Buffer.from(blob);
      if (buf.length < 1 + CRYPTO_IV_LENGTH + CRYPTO_TAG_LENGTH) {
        throw new Error('ciphertext too short');
      }
      if (buf[0] !== CRYPTO_BLOB_VERSION) throw new Error('unsupported crypto version');
      const iv = buf.subarray(1, 1 + CRYPTO_IV_LENGTH);
      const tag = buf.subarray(buf.length - CRYPTO_TAG_LENGTH);
      const ciphertext = buf.subarray(1 + CRYPTO_IV_LENGTH, buf.length - CRYPTO_TAG_LENGTH);
      const decipher = createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    },
  };
};

export const encryptUtf8 = async (port: ICryptoPort, text: string): Promise<Uint8Array> =>
  port.encrypt(new TextEncoder().encode(text));

export const decryptUtf8 = async (port: ICryptoPort, blob: Uint8Array): Promise<string> =>
  new TextDecoder().decode(await port.decrypt(blob));

export const createCryptoFromEnv = (env: {
  CRYPTO_MASTER_KEY?: string | undefined;
  NODE_ENV?: string | undefined;
}): ICryptoPort => {
  if (env.CRYPTO_MASTER_KEY) return createAes256Gcm(env.CRYPTO_MASTER_KEY);
  if (env.NODE_ENV === 'production') {
    throw new Error('CRYPTO_MASTER_KEY is required in production');
  }
  return createAes256Gcm(DEV_CRYPTO_KEY_HEX);
};

export { createStdioCryptoPort, type StdioCryptoChild } from './stdio.js';
