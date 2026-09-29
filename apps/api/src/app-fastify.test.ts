import { Writable } from 'node:stream';
import { REQUEST_ID_HEADER } from '@ysk/api-http';
import pino from 'pino';
import { beforeEach, describe, expect, it } from 'vitest';
import { createFastifyApp } from './app-fastify';
import { createMemoryInput } from './create-memory-input';

describe('fastify adapter', () => {
  let app: Awaited<ReturnType<typeof createFastifyApp>>;

  beforeEach(async () => {
    app = await createFastifyApp(createMemoryInput().input);
  });

  it('returns health', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true, data: { status: 'ok' } });
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
  });

  it('serves Scalar docs and OpenAPI JSON', async () => {
    const docs = await app.inject({ method: 'GET', url: '/docs' });
    expect(docs.statusCode).toBe(200);
    expect(String(docs.headers['content-type'])).toContain('text/html');
    expect(docs.body).toContain('api-reference');
    const spec = await app.inject({ method: 'GET', url: '/openapi.json' });
    expect(spec.statusCode).toBe(200);
    const body = spec.json() as { paths: Record<string, unknown> };
    expect(body.paths['/health']).toBeDefined();
    expect(body.paths['/v1/billing/plans']).toBeDefined();
  });

  it('rate-limits when configured', async () => {
    const limited = await createFastifyApp({
      ...createMemoryInput().input,
      rateLimit: { windowMs: 60_000, max: 3 },
    });
    const send = () =>
      limited.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { email: 'a@ysk.hk', password: 'password1' },
      });
    expect((await send()).statusCode).not.toBe(429);
    expect((await send()).statusCode).not.toBe(429);
    expect((await send()).statusCode).not.toBe(429);
    const blocked = await send();
    expect(blocked.statusCode).toBe(429);
    expect(blocked.json().error.code).toBe('RATE_LIMITED');
    const health = await limited.inject({ method: 'GET', url: '/health' });
    expect(health.statusCode).toBe(200);
    await limited.close();
  });

  it('rejects me without a token', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/me' });
    expect(res.statusCode).toBe(401);
    expect(res.json().ok).toBe(false);
  });

  it('registers, logs in, and reads me', async () => {
    const registered = await app.inject({
      method: 'POST',
      url: '/v1/auth/register',
      payload: { email: 'dev@ysk.hk', password: 'password1', displayName: 'Ki' },
    });
    expect(registered.statusCode).toBe(201);
    expect(registered.json().ok).toBe(true);
    const token = registered.json().data.accessToken as string;
    const me = await app.inject({
      method: 'GET',
      url: '/v1/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().data.email).toBe('dev@ysk.hk');
  });

  it('accepts an API key Bearer for me', async () => {
    const registered = await app.inject({
      method: 'POST',
      url: '/v1/auth/register',
      payload: { email: 'key@ysk.hk', password: 'password1', displayName: 'Key' },
    });
    const jwt = registered.json().data.accessToken as string;
    const created = await app.inject({
      method: 'POST',
      url: '/v1/me/api-keys',
      headers: { authorization: `Bearer ${jwt}` },
      payload: { name: 'bot', permissions: ['file.upload'] },
    });
    expect(created.statusCode).toBe(201);
    const token = created.json().data.token as string;
    const me = await app.inject({
      method: 'GET',
      url: '/v1/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().data.email).toBe('key@ysk.hk');
  });

  it('hides bull board without queues and requires ADMIN when mounted', async () => {
    const missing = await app.inject({ method: 'GET', url: '/admin/queues' });
    expect(missing.statusCode).toBe(404);
    const mem = createMemoryInput();
    const boardApp = await createFastifyApp({ ...mem.input, bullmqQueues: [] });
    const anon = await boardApp.inject({ method: 'GET', url: '/admin/queues' });
    expect(anon.statusCode).toBe(401);
    await boardApp.inject({
      method: 'POST',
      url: '/v1/auth/register',
      payload: { email: 'user@ysk.hk', password: 'password1', displayName: 'User' },
    });
    const userLogin = await boardApp.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'user@ysk.hk', password: 'password1' },
    });
    const userDenied = await boardApp.inject({
      method: 'GET',
      url: '/admin/queues',
      headers: { authorization: `Bearer ${userLogin.json().data.accessToken}` },
    });
    expect(userDenied.statusCode).toBe(403);
    await boardApp.inject({
      method: 'POST',
      url: '/v1/auth/register',
      payload: { email: 'ops-admin@ysk.hk', password: 'password1', displayName: 'OpsAdmin' },
    });
    const adminUser = await mem.users.findByEmail('ops-admin@ysk.hk');
    if (!adminUser) throw new Error('missing admin');
    adminUser.role = 'ADMIN';
    await mem.users.save(adminUser);
    const adminLogin = await boardApp.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'ops-admin@ysk.hk', password: 'password1' },
    });
    const ok = await boardApp.inject({
      method: 'GET',
      url: '/admin/queues',
      headers: { authorization: `Bearer ${adminLogin.json().data.accessToken}` },
    });
    expect(ok.statusCode).toBeLessThan(400);
    let envelopeOk: unknown;
    try {
      envelopeOk = (JSON.parse(ok.body) as { ok?: unknown }).ok;
    } catch {
      envelopeOk = undefined;
    }
    expect(envelopeOk).not.toBe(false);
    await boardApp.close();
  });

  it('writes an access log line for each response', async () => {
    const chunks: Buffer[] = [];
    const destination = new Writable({
      write(chunk, _enc, cb) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
        cb();
      },
    });
    const logger = pino({ level: 'info' }, destination);
    const logged = await createFastifyApp({ ...createMemoryInput().input, logger });
    const res = await logged.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const line = Buffer.concat(chunks).toString().trim().split('\n').at(-1) ?? '';
    const parsed = JSON.parse(line) as {
      msg: string;
      reqId?: string;
      method?: string;
      url?: string;
      statusCode?: number;
    };
    expect(parsed.msg).toBe('request');
    expect(parsed.method).toBe('GET');
    expect(parsed.url).toBe('/health');
    expect(parsed.statusCode).toBe(200);
    expect(parsed.reqId).toBe(res.headers[REQUEST_ID_HEADER]);
    await logged.close();
  });
});
