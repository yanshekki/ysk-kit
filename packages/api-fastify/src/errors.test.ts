import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { registerOptionalJwt } from './auth.js';
import { registerErrorHandler } from './errors.js';
import { mountFastify } from './mount.js';

describe('api-fastify', () => {
  it('maps thrown errors into the envelope', async () => {
    const app = Fastify();
    registerErrorHandler(app);
    app.get('/boom', async () => {
      throw new Error('nope');
    });
    const res = await app.inject({ method: 'GET', url: '/boom' });
    expect(res.statusCode).toBe(500);
    const body = res.json() as { ok: false; error: { code: string } };
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('INTERNAL');
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
