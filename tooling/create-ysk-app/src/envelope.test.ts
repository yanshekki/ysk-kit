import { describe, expect, it } from 'vitest';
import { unwrapEnvelope } from './envelope';

describe('unwrapEnvelope', () => {
  it('returns data when ok', () => {
    expect(unwrapEnvelope({ ok: true, data: { status: 'ok' } })).toEqual({ status: 'ok' });
  });

  it('throws the error message when not ok', () => {
    expect(() =>
      unwrapEnvelope({ ok: false, error: { code: 'UNAUTHENTICATED', message: '尚未登入' } }),
    ).toThrow('尚未登入');
  });
});
