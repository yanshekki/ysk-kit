import { AppError } from '@ysk-kit/domain-kernel';
import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createErrorHandler } from './error-handler.js';

const invoke = (
  error: unknown,
  opts: Parameters<typeof createErrorHandler>[0] = {},
): { status: number; body: { ok: false; error: { code: string; requestId: string } } } => {
  const handler = createErrorHandler(opts);
  let status = 0;
  let body: { ok: false; error: { code: string; requestId: string } } | undefined;
  const res = {
    status(code: number) {
      status = code;
      return this;
    },
    json(payload: { ok: false; error: { code: string; requestId: string } }) {
      body = payload;
      return this;
    },
  };
  handler(
    error as Error,
    { headers: { 'x-request-id': 'rid-http' } } as unknown as Request,
    res as unknown as Response,
    (() => {}) as NextFunction,
  );
  if (!body) throw new Error('handler did not send JSON');
  return { status, body };
};

describe('createErrorHandler', () => {
  it('logs INTERNAL with requestId and records the metric', () => {
    const logger = { error: vi.fn() };
    const recordHttpError = vi.fn();
    const boom = new Error('nope');
    const res = invoke(boom, { logger, recordHttpError });
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      ok: false,
      error: { code: 'INTERNAL', requestId: 'rid-http' },
    });
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error.mock.calls[0]?.[0]).toMatchObject({
      err: boom,
      requestId: 'rid-http',
      code: 'INTERNAL',
      status: 500,
    });
    expect(recordHttpError).toHaveBeenCalledWith({ code: 'INTERNAL', status: 500 });
  });

  it('does not logger.error expected 4xx AppError', () => {
    const logger = { error: vi.fn() };
    const recordHttpError = vi.fn();
    const res = invoke(new AppError('NOT_FOUND'), { logger, recordHttpError });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(logger.error).not.toHaveBeenCalled();
    expect(recordHttpError).not.toHaveBeenCalled();
  });

  it('maps ZodError to 422 without ERROR log', () => {
    const logger = { error: vi.fn() };
    const res = invoke(new z.ZodError([]), { logger });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    expect(logger.error).not.toHaveBeenCalled();
  });
});
