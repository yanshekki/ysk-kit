import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { createLogger } from './index.js';

const lastJson = (chunks: Buffer[]): Record<string, unknown> => {
  const line = Buffer.concat(chunks).toString().trim().split('\n').at(-1) ?? '';
  return JSON.parse(line) as Record<string, unknown>;
};

describe('createLogger', () => {
  it('applies mixin fields onto production JSON logs', () => {
    const chunks: Buffer[] = [];
    const destination = new Writable({
      write(chunk, _enc, cb) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
        cb();
      },
    });
    const logger = createLogger({
      env: 'production',
      mixin: () => ({ trace_id: 't', span_id: 's' }),
      destination,
    });
    logger.info('hello');
    const parsed = lastJson(chunks);
    expect(parsed.msg).toBe('hello');
    expect(parsed.trace_id).toBe('t');
    expect(parsed.span_id).toBe('s');
  });

  it('redacts authorization, cookies, tokens, passwords, and API keys', () => {
    const chunks: Buffer[] = [];
    const destination = new Writable({
      write(chunk, _enc, cb) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
        cb();
      },
    });
    const logger = createLogger({ env: 'production', destination });
    logger.info(
      {
        password: 'hunter2',
        authorization: 'Bearer super-secret',
        token: 'tok_live_secret',
        apiKey: 'sk_test_secret',
        cookie: 'ysk.access=abc',
        req: { headers: { authorization: 'Bearer nested-secret', cookie: 'sid=1' } },
      },
      'login',
    );
    const raw = Buffer.concat(chunks).toString();
    expect(raw).not.toContain('hunter2');
    expect(raw).not.toContain('super-secret');
    expect(raw).not.toContain('tok_live_secret');
    expect(raw).not.toContain('sk_test_secret');
    expect(raw).not.toContain('ysk.access=abc');
    expect(raw).not.toContain('nested-secret');
    const parsed = lastJson(chunks);
    expect(parsed.password).toBe('[Redacted]');
    expect(parsed.authorization).toBe('[Redacted]');
    expect(parsed.token).toBe('[Redacted]');
    expect(parsed.apiKey).toBe('[Redacted]');
    expect(parsed.cookie).toBe('[Redacted]');
    const req = parsed.req as { headers: { authorization: string; cookie: string } };
    expect(req.headers.authorization).toBe('[Redacted]');
    expect(req.headers.cookie).toBe('[Redacted]');
  });
});
