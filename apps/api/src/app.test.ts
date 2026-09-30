import { hashPassword } from '@ysk-kit/auth';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { createMemoryInput } from './create-memory-input';

describe('api auth', () => {
  let mem: ReturnType<typeof createMemoryInput>;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    mem = createMemoryInput();
    app = createApp(mem.input);
  });

  it('returns health and ready', async () => {
    const health = await request(app).get('/health');
    expect(health.status).toBe(200);
    expect(health.headers['x-content-type-options']).toBe('nosniff');
    expect(health.headers['x-frame-options']).toBe('DENY');
    const ready = await request(app).get('/ready');
    expect(ready.status).toBe(200);
  });

  it('serves Scalar docs and OpenAPI JSON', async () => {
    const docs = await request(app).get('/docs');
    expect(docs.status).toBe(200);
    expect(String(docs.headers['content-type'])).toContain('text/html');
    expect(docs.text).toContain('api-reference');
    const spec = await request(app).get('/openapi.json');
    expect(spec.status).toBe(200);
    expect(spec.body.paths['/health']).toBeDefined();
    expect(spec.body.paths['/v1/auth/login']).toBeDefined();
  });

  it('rate-limits when configured', async () => {
    const limited = createApp({ ...mem.input, rateLimit: { windowMs: 60_000, max: 3 } });
    const send = () =>
      request(limited).post('/v1/auth/login').send({ email: 'a@ysk.hk', password: 'password1' });
    expect((await send()).status).not.toBe(429);
    expect((await send()).status).not.toBe(429);
    expect((await send()).status).not.toBe(429);
    const blocked = await send();
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
    const health = await request(limited).get('/health');
    expect(health.status).toBe(200);
  });

  it('registers, reads me, and lists users with a token', async () => {
    const registered = await request(app).post('/v1/auth/register').send({
      email: 'dev@ysk.hk',
      password: 'password1',
      displayName: 'Ki',
    });
    expect(registered.status).toBe(201);
    const token = registered.body.data.accessToken as string;
    const me = await request(app).get('/v1/me').set('authorization', `Bearer ${token}`);
    expect(me.body.data.email).toBe('dev@ysk.hk');
    const list = await request(app).get('/v1/users').set('authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.items).toHaveLength(1);
    const notes = await request(app)
      .get('/v1/notifications')
      .set('authorization', `Bearer ${token}`);
    expect(notes.body.data.items.length).toBeGreaterThan(0);
    expect(mem.mail.sink.some((row) => row.template === 'auth.welcome')).toBe(true);
  });

  it('rejects users list without a token', async () => {
    const res = await request(app).get('/v1/users');
    expect(res.status).toBe(401);
  });

  it('rejects invalid login', async () => {
    await request(app).post('/v1/auth/register').send({
      email: 'dev@ysk.hk',
      password: 'password1',
      displayName: 'Ki',
    });
    const res = await request(app).post('/v1/auth/login').send({
      email: 'dev@ysk.hk',
      password: 'wrong-pass',
    });
    expect(res.status).toBe(401);
  });

  it('forbids USER from creating users', async () => {
    const registered = await request(app).post('/v1/auth/register').send({
      email: 'user@ysk.hk',
      password: 'password1',
      displayName: 'User',
    });
    const token = registered.body.data.accessToken as string;
    const res = await request(app)
      .post('/v1/users')
      .set('authorization', `Bearer ${token}`)
      .send({ email: 'other@ysk.hk', displayName: 'Other' });
    expect(res.status).toBe(403);
  });

  it('rotates refresh tokens and rejects reuse', async () => {
    const registered = await request(app).post('/v1/auth/register').send({
      email: 'dev@ysk.hk',
      password: 'password1',
      displayName: 'Ki',
    });
    const oldRefresh = registered.body.data.refreshToken as string;
    const rotated = await request(app).post('/v1/auth/refresh').send({ refreshToken: oldRefresh });
    expect(rotated.status).toBe(200);
    const reused = await request(app).post('/v1/auth/refresh').send({ refreshToken: oldRefresh });
    expect(reused.status).toBe(401);
  });

  it('verifies otp from the stub sender', async () => {
    const requested = await request(app)
      .post('/v1/auth/otp/request')
      .send({ phone: '+85291234567' });
    expect(requested.status).toBe(200);
    const verified = await request(app).post('/v1/auth/otp/verify').send({
      phone: '+85291234567',
      code: mem.otpSink.last?.code,
    });
    expect(verified.status).toBe(200);
    expect(verified.body.data.user.phone).toBe('+85291234567');
  });

  it('accepts forgot for unknown emails and resets with a token', async () => {
    await request(app).post('/v1/auth/register').send({
      email: 'dev@ysk.hk',
      password: 'password1',
      displayName: 'Ki',
    });
    const unknown = await request(app).post('/v1/auth/forgot').send({ email: 'nope@ysk.hk' });
    expect(unknown.status).toBe(200);
    const forgot = await request(app).post('/v1/auth/forgot').send({ email: 'dev@ysk.hk' });
    expect(forgot.status).toBe(200);
    expect(JSON.stringify(mem.mail.sink)).not.toContain('token=');
    const resetJob = mem.jobs.find(
      (job) => job.name === 'email.send' && job.payload.vars?.resetUrl,
    );
    const token = new URL(resetJob?.payload.vars?.resetUrl ?? 'http://x').searchParams.get('token');
    expect(token).toBeTruthy();
    const reset = await request(app).post('/v1/auth/reset').send({ token, password: 'password2' });
    expect(reset.status).toBe(200);
    const oldLogin = await request(app).post('/v1/auth/login').send({
      email: 'dev@ysk.hk',
      password: 'password1',
    });
    expect(oldLogin.status).toBe(401);
    const newLogin = await request(app).post('/v1/auth/login').send({
      email: 'dev@ysk.hk',
      password: 'password2',
    });
    expect(newLogin.status).toBe(200);
  });

  it('emits notification.created on the realtime port', async () => {
    await request(app).post('/v1/auth/register').send({
      email: 'dev@ysk.hk',
      password: 'password1',
      displayName: 'Ki',
    });
    expect(mem.realtime.events.some((event) => event.event === 'notification.created')).toBe(true);
  });

  it('suspends a user and revokes sessions', async () => {
    const adminRes = await request(app).post('/v1/auth/register').send({
      email: 'admin@ysk.hk',
      password: 'password1',
      displayName: 'Admin',
    });
    const targetRes = await request(app).post('/v1/auth/register').send({
      email: 'target@ysk.hk',
      password: 'password1',
      displayName: 'Target',
    });
    const admin = await mem.users.findByEmail('admin@ysk.hk');
    if (!admin) throw new Error('admin missing');
    admin.role = 'ADMIN';
    await mem.users.save(admin);
    const adminLogin = await request(app).post('/v1/auth/login').send({
      email: 'admin@ysk.hk',
      password: 'password1',
    });
    const adminToken = adminLogin.body.data.accessToken as string;
    const targetId = targetRes.body.data.user.id as string;
    const forbidden = await request(app)
      .post(`/v1/users/${targetId}/suspend`)
      .set('authorization', `Bearer ${targetRes.body.data.accessToken}`)
      .send({});
    expect(forbidden.status).toBe(403);
    const self = await request(app)
      .post(`/v1/users/${adminRes.body.data.user.id}/suspend`)
      .set('authorization', `Bearer ${adminToken}`)
      .send({});
    expect(self.status).toBe(403);
    const suspended = await request(app)
      .post(`/v1/users/${targetId}/suspend`)
      .set('authorization', `Bearer ${adminToken}`)
      .send({});
    expect(suspended.status).toBe(200);
    expect(suspended.body.data.status).toBe('SUSPENDED');
    const login = await request(app).post('/v1/auth/login').send({
      email: 'target@ysk.hk',
      password: 'password1',
    });
    expect(login.status).toBe(403);
    const refresh = await request(app)
      .post('/v1/auth/refresh')
      .send({ refreshToken: targetRes.body.data.refreshToken });
    expect(refresh.status).toBe(401);
    expect(mem.sessions).toBeDefined();
  });

  it('blocks INVITED users from logging in even with a password', async () => {
    await mem.users.create({
      email: 'invited@ysk.hk',
      displayName: 'Invited',
      role: 'USER',
      status: 'INVITED',
      passwordHash: await hashPassword('password1'),
    });
    const login = await request(app).post('/v1/auth/login').send({
      email: 'invited@ysk.hk',
      password: 'password1',
    });
    expect(login.status).toBe(403);
  });

  it('signs in an ADMIN with email OTP', async () => {
    await request(app).post('/v1/auth/register').send({
      email: 'boss@ysk.hk',
      password: 'password1',
      displayName: 'Boss',
    });
    const boss = await mem.users.findByEmail('boss@ysk.hk');
    if (!boss) throw new Error('missing boss');
    boss.role = 'ADMIN';
    await mem.users.save(boss);
    const unknown = await request(app)
      .post('/v1/auth/admin/otp/request')
      .send({ email: 'nobody@ysk.hk' });
    expect(unknown.status).toBe(200);
    expect(unknown.body.data.sent).toBe(true);
    const sent = await request(app)
      .post('/v1/auth/admin/otp/request')
      .send({ email: 'boss@ysk.hk' });
    expect(sent.status).toBe(200);
    const otpJob = mem.jobs.find((job) => job.name === 'email.send' && job.payload.vars?.code);
    const code = otpJob?.payload.vars?.code ?? '';
    expect(code).toMatch(/^\d{6}$/);
    const verified = await request(app)
      .post('/v1/auth/admin/otp/verify')
      .set('x-ysk-platform', 'admin')
      .send({ email: 'boss@ysk.hk', code });
    expect(verified.status).toBe(200);
    expect(verified.body.data.user.role).toBe('ADMIN');
    const reused = await request(app)
      .post('/v1/auth/admin/otp/verify')
      .send({ email: 'boss@ysk.hk', code });
    expect(reused.status).toBe(401);
  });

  it('hides bull board without queues and requires ADMIN when mounted', async () => {
    const missing = await request(app).get('/admin/queues');
    expect(missing.status).toBe(404);
    const boardApp = createApp({ ...mem.input, bullmqQueues: [] });
    const anon = await request(boardApp).get('/admin/queues');
    expect(anon.status).toBe(401);
    await request(boardApp).post('/v1/auth/register').send({
      email: 'user@ysk.hk',
      password: 'password1',
      displayName: 'User',
    });
    const userLogin = await request(boardApp).post('/v1/auth/login').send({
      email: 'user@ysk.hk',
      password: 'password1',
    });
    const userDenied = await request(boardApp)
      .get('/admin/queues')
      .set('authorization', `Bearer ${userLogin.body.data.accessToken}`);
    expect(userDenied.status).toBe(403);
    await request(boardApp).post('/v1/auth/register').send({
      email: 'ops-admin@ysk.hk',
      password: 'password1',
      displayName: 'OpsAdmin',
    });
    const adminUser = await mem.users.findByEmail('ops-admin@ysk.hk');
    if (!adminUser) throw new Error('missing admin');
    adminUser.role = 'ADMIN';
    await mem.users.save(adminUser);
    const adminLogin = await request(boardApp).post('/v1/auth/login').send({
      email: 'ops-admin@ysk.hk',
      password: 'password1',
    });
    const ok = await request(boardApp)
      .get('/admin/queues')
      .set('authorization', `Bearer ${adminLogin.body.data.accessToken}`);
    expect(ok.status).toBeLessThan(400);
    expect(ok.body?.ok).not.toBe(false);
  });

  it('rejects USER admin OTP verify', async () => {
    await request(app).post('/v1/auth/register').send({
      email: 'pleb@ysk.hk',
      password: 'password1',
      displayName: 'Pleb',
    });
    const sent = await request(app)
      .post('/v1/auth/admin/otp/request')
      .send({ email: 'pleb@ysk.hk' });
    expect(sent.status).toBe(200);
    const verified = await request(app)
      .post('/v1/auth/admin/otp/verify')
      .send({ email: 'pleb@ysk.hk', code: '123456' });
    expect(verified.status).toBe(401);
  });

  it('creates an API key shown once and uses it as Bearer', async () => {
    const registered = await request(app).post('/v1/auth/register').send({
      email: 'keys@ysk.hk',
      password: 'password1',
      displayName: 'Keys',
    });
    const jwt = registered.body.data.accessToken as string;
    const created = await request(app)
      .post('/v1/me/api-keys')
      .set('authorization', `Bearer ${jwt}`)
      .send({ name: 'ci', permissions: ['file.upload'] });
    expect(created.status).toBe(201);
    const token = created.body.data.token as string;
    expect(token.startsWith('ysk_live_')).toBe(true);
    const list = await request(app).get('/v1/me/api-keys').set('authorization', `Bearer ${jwt}`);
    expect(list.body.data[0].last4).toHaveLength(4);
    expect(JSON.stringify(list.body)).not.toContain(token);
    const me = await request(app).get('/v1/me').set('authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    const manage = await request(app)
      .post('/v1/me/api-keys')
      .set('authorization', `Bearer ${token}`)
      .send({ name: 'nope', permissions: ['file.upload'] });
    expect(manage.status).toBe(403);
  });

  it('rejects revoked API keys', async () => {
    const registered = await request(app).post('/v1/auth/register').send({
      email: 'rev@ysk.hk',
      password: 'password1',
      displayName: 'Rev',
    });
    const jwt = registered.body.data.accessToken as string;
    const created = await request(app)
      .post('/v1/me/api-keys')
      .set('authorization', `Bearer ${jwt}`)
      .send({ name: 'tmp', permissions: ['file.upload'] });
    const id = created.body.data.id as string;
    const token = created.body.data.token as string;
    await request(app).delete(`/v1/me/api-keys/${id}`).set('authorization', `Bearer ${jwt}`);
    const me = await request(app).get('/v1/me').set('authorization', `Bearer ${token}`);
    expect(me.status).toBe(401);
  });
});
