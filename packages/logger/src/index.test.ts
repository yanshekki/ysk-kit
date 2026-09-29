import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { createLogger } from './index';

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
    const line = Buffer.concat(chunks).toString().trim().split('\n').at(-1) ?? '';
    const parsed = JSON.parse(line) as { msg: string; trace_id: string; span_id: string };
    expect(parsed.msg).toBe('hello');
    expect(parsed.trace_id).toBe('t');
    expect(parsed.span_id).toBe('s');
  });
});
