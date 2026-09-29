import { describe, expect, it } from 'vitest';
import { createLocalStorage, createStorageFromEnv } from './index';

describe('storage', () => {
  it('uses local adapter when S3 env is empty', () => {
    const storage = createStorageFromEnv({ API_PUBLIC_URL: 'http://localhost:3001' });
    expect(storage.putLocal).toBeTypeOf('function');
  });

  it('local presign encodes the key', async () => {
    const storage = createLocalStorage({ publicBaseUrl: 'http://localhost:3001' });
    const signed = await storage.presignPut({
      key: 'a/b.txt',
      mime: 'text/plain',
      byteSize: 4,
    });
    expect(signed.url).toContain(encodeURIComponent('a/b.txt'));
  });
});
