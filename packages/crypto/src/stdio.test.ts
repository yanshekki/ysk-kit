import { PassThrough } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { createStdioCryptoPort } from './stdio.js';

describe('createStdioCryptoPort', () => {
  it('frames encrypt over newline JSON and does not use fetch', async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    stdin.on('data', (chunk: Buffer) => {
      const req = JSON.parse(chunk.toString('utf8').trim()) as {
        id: string;
        op: string;
        blob: string;
      };
      expect(req.op).toBe('encrypt');
      expect(Buffer.from(req.blob, 'base64').equals(Buffer.from([1, 2, 3]))).toBe(true);
      stdout.write(
        `${JSON.stringify({ id: req.id, ok: true, blob: Buffer.from('cipher').toString('base64') })}\n`,
      );
    });
    const port = createStdioCryptoPort({
      spawn: () => ({ stdin, stdout }),
    });
    const out = await port.encrypt(Uint8Array.from([1, 2, 3]));
    expect(Buffer.from(out).equals(Buffer.from('cipher'))).toBe(true);
    expect(createStdioCryptoPort.toString()).not.toContain('fetch(');
  });

  it('maps a sidecar error to op failed without a payload', async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    stdin.on('data', (chunk: Buffer) => {
      const req = JSON.parse(chunk.toString('utf8').trim()) as { id: string };
      stdout.write(`${JSON.stringify({ id: req.id, ok: false, error: 'op failed' })}\n`);
    });
    const port = createStdioCryptoPort({
      spawn: () => ({ stdin, stdout }),
    });
    await expect(port.decrypt(Uint8Array.from([9]))).rejects.toThrow('op failed');
  });
});
