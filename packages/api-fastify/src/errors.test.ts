import { AppError } from '@ysk-kit/domain-kernel';
import Fastify from 'fastify';
import { describe, expect, it, vi } from 'vitest';
import { registerOptionalJwt } from './auth.js';
import { registerErrorHandler } from './errors.js';
import { mountFastify } from './mount.js';

describe('api-fastify', () => {
  it('maps thrown errors into the envelope and logs INTERNAL', async () => {
    const logger = { error: vi.fn() };
    const recordHttpError = vi.fn();
    const app = Fastify();
    registerErrorHandler(app, { logger, recordHttpError });
    app.get('/boom', async () => {
      throw new Error('nope');
    });
    const res = await app.inject({
      method: 'GET',
      url: '/boom',
      headers: { 'x-request-id': 'rid-f' },
    });
    expect(res.statusCode).toBe(500);
    const body = res.json() as { ok: false; error: { code: string; requestId: string } };
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('INTERNAL');
    expect(body.error.requestId).toBe('rid-f');
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error.mock.calls[0]?.[0]).toMatchObject({
      requestId: 'rid-f',
      code: 'INTERNAL',
      status: 500,
    });
    expect(recordHttpError).toHaveBeenCalledWith({ code: 'INTERNAL', status: 500 });
    await app.close();
  });

  it('does not logger.error expected 4xx AppError', async () => {
    const logger = { error: vi.fn() };
    const app = Fastify();
    registerErrorHandler(app, { logger });
    app.get('/missing', async () => {
      throw new AppError('NOT_FOUND');
    });
    const res = await app.inject({ method: 'GET', url: '/missing' });
    expect(res.statusCode).toBe(404);
    expect(logger.error).not.toHaveBeenCalled();
    await app.close();
  });

  it('mounts a contract route and reads optional jwt', async () => {
    const app = Fastify();
    registerOptionalJwt(app, 'secret-must-be-long-enough');
    mountFastify(
      app,
      {
        health: {
          method: 'GET',
          path: '/health',
          responses: {},
        },
      } as never,
      {
        health: async () => ({ status: 200, body: { ok: true, data: { status: 'ok' } } }),
      },
    );
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true, data: { status: 'ok' } });
    await app.close();
  });
});
