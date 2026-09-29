import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const VERSION = 1;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
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
      const iv = randomBytes(IV_LENGTH);
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
      const tag = cipher.getAuthTag();
      return Buffer.concat([Buffer.from([VERSION]), iv, ciphertext, tag]);
    },
    async decrypt(blob) {
      const buf = Buffer.from(blob);
      if (buf.length < 1 + IV_LENGTH + TAG_LENGTH) throw new Error('ciphertext too short');
      if (buf[0] !== VERSION) throw new Error('unsupported crypto version');
      const iv = buf.subarray(1, 1 + IV_LENGTH);
      const tag = buf.subarray(buf.length - TAG_LENGTH);
      const ciphertext = buf.subarray(1 + IV_LENGTH, buf.length - TAG_LENGTH);
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
