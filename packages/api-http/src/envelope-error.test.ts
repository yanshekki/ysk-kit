import { AppError } from '@ysk-kit/domain-kernel';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { classifyEnvelopeLog, envelopeError, reportEnvelopeError } from './envelope-error.js';

describe('envelopeError', () => {
  it('maps unknown throws to INTERNAL without leaking the message', () => {
    const mapped = envelopeError(new Error('secret boom'), 'rid-1');
    expect(mapped.status).toBe(500);
    expect(mapped.body.error.code).toBe('INTERNAL');
    expect(mapped.body.error.requestId).toBe('rid-1');
    expect(mapped.body.error.message).not.toContain('secret boom');
  });

  it('keeps AppError code and status', () => {
    const mapped = envelopeError(new AppError('NOT_FOUND'), 'rid-2');
    expect(mapped.status).toBe(404);
    expect(mapped.body.error.code).toBe('NOT_FOUND');
  });
});

describe('classifyEnvelopeLog', () => {
  it('marks INTERNAL and 5xx as error', () => {
    const unknown = envelopeError(new Error('boom'), 'rid-3');
    expect(classifyEnvelopeLog(unknown).level).toBe('error');
    const internal = envelopeError(new AppError('INTERNAL', 'LLM not configured', 503), 'rid-4');
    expect(classifyEnvelopeLog(internal)).toMatchObject({
      level: 'error',
      code: 'INTERNAL',
      status: 503,
    });
  });

  it('keeps expected 4xx silent', () => {
    const notFound = envelopeError(new AppError('NOT_FOUND'), 'rid-5');
    expect(classifyEnvelopeLog(notFound).level).toBe('silent');
    const zod = envelopeError(new z.ZodError([]), 'rid-6');
    expect(classifyEnvelopeLog(zod)).toMatchObject({
      level: 'silent',
      code: 'VALIDATION_FAILED',
      status: 422,
    });
  });
});

describe('reportEnvelopeError', () => {
  it('logs and records only ERROR-level mappings', () => {
    const logger = { error: vi.fn() };
    const recordHttpError = vi.fn();
    const boom = new Error('boom');
    reportEnvelopeError({ logger, recordHttpError }, envelopeError(boom, 'rid-7'), boom);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error.mock.calls[0]?.[0]).toMatchObject({
      err: boom,
      requestId: 'rid-7',
      code: 'INTERNAL',
      status: 500,
    });
    expect(recordHttpError).toHaveBeenCalledWith({ code: 'INTERNAL', status: 500 });

    logger.error.mockClear();
    recordHttpError.mockClear();
    const missing = new AppError('NOT_FOUND');
    reportEnvelopeError({ logger, recordHttpError }, envelopeError(missing, 'rid-8'), missing);
    expect(logger.error).not.toHaveBeenCalled();
    expect(recordHttpError).not.toHaveBeenCalled();
  });
});
