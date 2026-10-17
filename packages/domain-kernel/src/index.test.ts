import { describe, expect, it } from 'vitest';
import { AppError, attachRequestId, DomainError, err, ok } from './index.js';

describe('domain-kernel', () => {
  it('wraps success and failure', () => {
    expect(ok(1)).toEqual({ ok: true, value: 1 });
    expect(err('no').ok).toBe(false);
  });

  it('DomainError is an AppError', () => {
    const error = new DomainError('CONFLICT', 'taken');
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe('CONFLICT');
  });

  it('attaches requestId without passing undefined details', () => {
    const error = attachRequestId(new AppError('INTERNAL'), 'rid-9');
    expect(error.requestId).toBe('rid-9');
    expect(error.code).toBe('INTERNAL');
  });
});
