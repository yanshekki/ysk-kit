import { createHmac } from 'node:crypto';
import { hashPassword } from '@ysk/auth';
import { createMemoryQueue, type IJobQueue } from '@ysk/jobs';
import { createFakeLlm } from '@ysk/llm';
import { createLogMailer } from '@ysk/mail';
import { createLogPush } from '@ysk/push';
import { createMemoryRealtime } from '@ysk/realtime';
import { createLocalStorage } from '@ysk/storage';
import pino from 'pino';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { createMemoryInput } from './create-memory-input';
import { createApiKeyService } from './modules/api-keys/application/api-key-service';
import { createMemoryApiKeyRepository } from './modules/api-keys/infra/memory-api-key-repository';
import { createBillingService } from './modules/billing/application/billing-service';
import { createLogBilling } from './modules/billing/infra/log-billing';
import { createMemorySubscriptionRepository } from './modules/billing/infra/memory-subscription-repository';
import { createStripeBilling } from './modules/billing/infra/stripe-billing';
import { createDeviceService } from './modules/devices/application/device-service';
import { createMemoryDeviceRepository } from './modules/devices/infra/memory-device-repository';
import { createFileService } from './modules/files/application/file-service';
import { createMemoryFileRepository } from './modules/files/infra/memory-file-repository';
import { createAuthService } from './modules/identity/application/auth-service';
import { createUserService } from './modules/identity/application/user-service';
import { createMemoryPasswordResetRepository } from './modules/identity/infra/memory-password-reset';
import {
  createMemoryAuditLogger,
  createMemoryOtpRepository,
  createMemorySessionRepository,
  createMemoryUserRepository,
  createSilentOtpSender,
} from './modules/identity/infra/memory-stores';
import { createLlmService } from './modules/llm/application/llm-service';
import { createMemoryLlmUsageRepository } from './modules/llm/infra/memory-usage-repository';
import { createNotificationService } from './modules/notifications/application/notification-service';
import { createMemoryNotificationRepository } from './modules/notifications/infra/memory-notification-repository';
import { createOrganizationService } from './modules/organizations/application/organization-service';
import { createMemoryOrganizationRepository } from './modules/organizations/infra/memory-organization-repository';
import { registerWorkers } from './workers';

const SECRET = 'test-secret-key-must-be-long';

const harness = () => {
  const otpSink: { last?: { phone: string; code: string } } = {};
  const jobs: Array<{ name: string; payload: { vars?: Record<string, string> } }> = [];
  const users = createMemoryUserRepository();
  const sessions = createMemorySessionRepository();
  const otps = createMemoryOtpRepository();
  const resets = createMemoryPasswordResetRepository();
  const audit = createMemoryAuditLogger();
  const notifications = createMemoryNotificationRepository();
  const devices = createMemoryDeviceRepository();
  const orgs = createMemoryOrganizationRepository();
  const keys = createMemoryApiKeyRepository();
  const push = createLogPush();
  const storage = createLocalStorage({ publicBaseUrl: 'http://localhost:3001' });
  const innerQueue = createMemoryQueue();
  const queue: IJobQueue = {
    enqueue: async (name, payload, opts) => {
      jobs.push({ name, payload: payload as { vars?: Record<string, string> } });
      return innerQueue.enqueue(name, payload, opts);
    },
    process: innerQueue.process.bind(innerQueue),
    close: innerQueue.close.bind(innerQueue),
  };
  const mail = createLogMailer();
  const realtime = createMemoryRealtime();
  const usage = createMemoryLlmUsageRepository();
  registerWorkers({
    queue: innerQueue,
    mail,
    notifications,
    realtime,
    devices,
    push,
  });
  const deviceService = createDeviceService(devices);
  const organizationService = createOrganizationService({
    orgs,
    users,
    jobs: queue,
    audit,
    webPublicUrl: 'http://localhost:5173',
  });
  const apiKeyService = createApiKeyService({ keys, users, audit });
  const llmService = createLlmService({
    llm: createFakeLlm({ text: 'pong' }),
    usage,
    configured: true,
    production: false,
  });
  const authService = createAuthService({
    users,
    sessions,
    otps,
    resets,
    jobs: queue,
    audit,
    otpSender: createSilentOtpSender(otpSink),
    webPublicUrl: 'http://localhost:5173',
    jwtSecret: SECRET,
    accessTtl: '15m',
    otpTtlSeconds: 300,
  });
  const app = createApp({
    authService,
    userService: createUserService(users, audit, queue, sessions),
    organizationService,
    apiKeyService,
    billingService: createBillingService({
      subscriptions: createMemorySubscriptionRepository(),
      billing: createLogBilling(),
      orgs,
    }),
    fileService: createFileService(createMemoryFileRepository(), storage, audit),
    notificationService: createNotificationService(notifications),
    llmService,
    deviceService,
    audit,
    storage,
    logger: pino({ level: 'silent' }),
    corsOrigins: ['http://localhost:5173'],
    jwtSecret: SECRET,
    resolveApiKey: (token: string) => apiKeyService.resolveToken(token),
    pingReady: async () => true,
    allowLocalUpload: true,
  });
  return { app, otpSink, mail, jobs, realtime, usage, push, users, sessions };
};

describe('api auth', () => {
  let app: ReturnType<typeof harness>['app'];
  let otpSink: { last?: { phone: string; code: string } };
  let mail: ReturnType<typeof createLogMailer>;
  let jobs: ReturnType<typeof harness>['jobs'];
  let realtime: ReturnType<typeof createMemoryRealtime>;
  let usage: ReturnType<typeof createMemoryLlmUsageRepository>;
  let push: ReturnType<typeof createLogPush>;
  let users: ReturnType<typeof createMemoryUserRepository>;
  let sessions: ReturnType<typeof createMemorySessionRepository>;

  beforeEach(() => {
    const h = harness();
    app = h.app;
    otpSink = h.otpSink;
    mail = h.mail;
    jobs = h.jobs;
    realtime = h.realtime;
    usage = h.usage;
    push = h.push;
    users = h.users;
    sessions = h.sessions;
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
    expect(spec.body.paths['/v1/billing/plans']).toBeDefined();
  });

  it('rate-limits when configured', async () => {
    const mem = createMemoryInput();
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
    expect(mail.sink.some((row) => row.template === 'auth.welcome')).toBe(true);
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
      code: otpSink.last?.code,
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
    expect(JSON.stringify(mail.sink)).not.toContain('token=');
    const resetJob = jobs.find((job) => job.name === 'email.send' && job.payload.vars?.resetUrl);
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

  it('completes llm as a signed-in user and records usage', async () => {
    const registered = await request(app).post('/v1/auth/register').send({
      email: 'dev@ysk.hk',
      password: 'password1',
      displayName: 'Ki',
    });
    const token = registered.body.data.accessToken as string;
    const res = await request(app)
      .post('/v1/llm/complete')
      .set('authorization', `Bearer ${token}`)
      .send({ messages: [{ role: 'user', content: 'ping' }] });
    expect(res.status).toBe(200);
    expect(res.body.data.text).toBe('pong');
    expect(usage.rows).toHaveLength(1);
  });

  it('rejects llm without a token', async () => {
    const res = await request(app)
      .post('/v1/llm/complete')
      .send({ messages: [{ role: 'user', content: 'ping' }] });
    expect(res.status).toBe(401);
  });

  it('streams llm deltas then done', async () => {
    const registered = await request(app).post('/v1/auth/register').send({
      email: 'dev@ysk.hk',
      password: 'password1',
      displayName: 'Ki',
    });
    const token = registered.body.data.accessToken as string;
    const res = await request(app)
      .post('/v1/llm/stream')
      .set('authorization', `Bearer ${token}`)
      .send({ messages: [{ role: 'user', content: 'ping' }] });
    expect(res.status).toBe(200);
    expect(res.text).toContain('event: delta');
    expect(res.text).toContain('event: done');
  });

  it('emits notification.created on the realtime port', async () => {
    await request(app).post('/v1/auth/register').send({
      email: 'dev@ysk.hk',
      password: 'password1',
      displayName: 'Ki',
    });
    expect(realtime.events.some((event) => event.event === 'notification.created')).toBe(true);
  });

  it('registers a device without exposing the full token and pushes on notify', async () => {
    const registered = await request(app).post('/v1/auth/register').send({
      email: 'dev@ysk.hk',
      password: 'password1',
      displayName: 'Ki',
    });
    const token = registered.body.data.accessToken as string;
    const created = await request(app)
      .put('/v1/me/devices')
      .set('authorization', `Bearer ${token}`)
      .send({ token: 'ExponentPushToken[abcdefghijklmnop]', platform: 'ios' });
    expect(created.status).toBe(200);
    expect(created.body.data.tokenSuffix).toHaveLength(8);
    expect(JSON.stringify(created.body)).not.toContain('ExponentPushToken');
    const list = await request(app).get('/v1/me/devices').set('authorization', `Bearer ${token}`);
    expect(list.body.data).toHaveLength(1);
    await request(app).post('/v1/auth/forgot').send({ email: 'dev@ysk.hk' });
    expect(push.sink.some((row) => row.title === '重設密碼')).toBe(true);
  });

  it('rejects devices without a token', async () => {
    const res = await request(app).get('/v1/me/devices');
    expect(res.status).toBe(401);
  });

  it('creates an org with the actor as owner', async () => {
    const registered = await request(app).post('/v1/auth/register').send({
      email: 'owner@ysk.hk',
      password: 'password1',
      displayName: 'Owner',
    });
    const token = registered.body.data.accessToken as string;
    const created = await request(app)
      .post('/v1/organizations')
      .set('authorization', `Bearer ${token}`)
      .send({ name: 'YSK' });
    expect(created.status).toBe(201);
    const list = await request(app)
      .get('/v1/organizations')
      .set('authorization', `Bearer ${token}`);
    expect(list.body.data).toHaveLength(1);
    const members = await request(app)
      .get(`/v1/organizations/${created.body.data.id}/members`)
      .set('authorization', `Bearer ${token}`);
    expect(members.body.data[0]?.role).toBe('OWNER');
  });

  it('rejects org list without a token', async () => {
    const res = await request(app).get('/v1/organizations');
    expect(res.status).toBe(401);
  });

  it('invites an existing user who accepts with the token only', async () => {
    const ownerRes = await request(app).post('/v1/auth/register').send({
      email: 'owner@ysk.hk',
      password: 'password1',
      displayName: 'Owner',
    });
    await request(app).post('/v1/auth/register').send({
      email: 'member@ysk.hk',
      password: 'password1',
      displayName: 'Member',
    });
    const ownerToken = ownerRes.body.data.accessToken as string;
    const org = await request(app)
      .post('/v1/organizations')
      .set('authorization', `Bearer ${ownerToken}`)
      .send({ name: 'YSK' });
    const invited = await request(app)
      .post(`/v1/organizations/${org.body.data.id}/invites`)
      .set('authorization', `Bearer ${ownerToken}`)
      .send({ email: 'member@ysk.hk', role: 'MEMBER' });
    expect(invited.status).toBe(200);
    expect(JSON.stringify(invited.body)).not.toContain('token=');
    const pending = await request(app)
      .get(`/v1/organizations/${org.body.data.id}/invites`)
      .set('authorization', `Bearer ${ownerToken}`);
    expect(JSON.stringify(pending.body)).not.toContain('token=');
    const inviteJob = jobs.find((job) => job.name === 'email.send' && job.payload.vars?.inviteUrl);
    const inviteToken = new URL(inviteJob?.payload.vars?.inviteUrl ?? 'http://x').searchParams.get(
      'token',
    );
    expect(inviteToken).toBeTruthy();
    const accepted = await request(app)
      .post('/v1/organizations/invites/accept')
      .send({ token: inviteToken });
    expect(accepted.status).toBe(200);
    const memberLogin = await request(app).post('/v1/auth/login').send({
      email: 'member@ysk.hk',
      password: 'password1',
    });
    const memberToken = memberLogin.body.data.accessToken as string;
    const members = await request(app)
      .get(`/v1/organizations/${org.body.data.id}/members`)
      .set('authorization', `Bearer ${memberToken}`);
    expect(members.body.data.some((row: { email: string }) => row.email === 'member@ysk.hk')).toBe(
      true,
    );
  });

  it('invites an unknown email then accepts with a password', async () => {
    const ownerRes = await request(app).post('/v1/auth/register').send({
      email: 'owner@ysk.hk',
      password: 'password1',
      displayName: 'Owner',
    });
    const ownerToken = ownerRes.body.data.accessToken as string;
    const org = await request(app)
      .post('/v1/organizations')
      .set('authorization', `Bearer ${ownerToken}`)
      .send({ name: 'YSK' });
    await request(app)
      .post(`/v1/organizations/${org.body.data.id}/invites`)
      .set('authorization', `Bearer ${ownerToken}`)
      .send({ email: 'new@ysk.hk', role: 'ADMIN' });
    const invitedUser = await users.findByEmail('new@ysk.hk');
    expect(invitedUser?.status).toBe('INVITED');
    const conflict = await request(app).post('/v1/auth/register').send({
      email: 'new@ysk.hk',
      password: 'password1',
      displayName: 'New',
    });
    expect(conflict.status).toBe(409);
    const inviteJob = jobs.find((job) => job.name === 'email.send' && job.payload.vars?.inviteUrl);
    const inviteToken = new URL(inviteJob?.payload.vars?.inviteUrl ?? 'http://x').searchParams.get(
      'token',
    );
    const accepted = await request(app)
      .post('/v1/organizations/invites/accept')
      .send({ token: inviteToken, password: 'password1', displayName: 'New' });
    expect(accepted.status).toBe(200);
    const login = await request(app).post('/v1/auth/login').send({
      email: 'new@ysk.hk',
      password: 'password1',
    });
    expect(login.status).toBe(200);
    expect(login.body.data.user.status).toBe('ACTIVE');
  });

  it('forbids members from inviting and protects the last owner', async () => {
    const ownerRes = await request(app).post('/v1/auth/register').send({
      email: 'owner@ysk.hk',
      password: 'password1',
      displayName: 'Owner',
    });
    const memberRes = await request(app).post('/v1/auth/register').send({
      email: 'member@ysk.hk',
      password: 'password1',
      displayName: 'Member',
    });
    const ownerToken = ownerRes.body.data.accessToken as string;
    const memberUser = await users.findByEmail('member@ysk.hk');
    const org = await request(app)
      .post('/v1/organizations')
      .set('authorization', `Bearer ${ownerToken}`)
      .send({ name: 'YSK' });
    await request(app)
      .post(`/v1/organizations/${org.body.data.id}/invites`)
      .set('authorization', `Bearer ${ownerToken}`)
      .send({ email: 'member@ysk.hk', role: 'MEMBER' });
    const inviteJob = jobs.find((job) => job.name === 'email.send' && job.payload.vars?.inviteUrl);
    const inviteToken = new URL(inviteJob?.payload.vars?.inviteUrl ?? 'http://x').searchParams.get(
      'token',
    );
    await request(app).post('/v1/organizations/invites/accept').send({ token: inviteToken });
    const memberToken = memberRes.body.data.accessToken as string;
    const inviteAttempt = await request(app)
      .post(`/v1/organizations/${org.body.data.id}/invites`)
      .set('authorization', `Bearer ${memberToken}`)
      .send({ email: 'other@ysk.hk', role: 'MEMBER' });
    expect(inviteAttempt.status).toBe(403);
    const leave = await request(app)
      .post(`/v1/organizations/${org.body.data.id}/leave`)
      .set('authorization', `Bearer ${ownerToken}`)
      .send({});
    expect(leave.status).toBe(403);
    const removeOwner = await request(app)
      .delete(`/v1/organizations/${org.body.data.id}/members/${ownerRes.body.data.user.id}`)
      .set('authorization', `Bearer ${ownerToken}`);
    expect(removeOwner.status).toBe(403);
    const removed = await request(app)
      .delete(`/v1/organizations/${org.body.data.id}/members/${memberUser?.id}`)
      .set('authorization', `Bearer ${ownerToken}`);
    expect(removed.status).toBe(200);
  });

  it('rejects expired or consumed invite tokens', async () => {
    const ownerRes = await request(app).post('/v1/auth/register').send({
      email: 'owner@ysk.hk',
      password: 'password1',
      displayName: 'Owner',
    });
    const ownerToken = ownerRes.body.data.accessToken as string;
    const org = await request(app)
      .post('/v1/organizations')
      .set('authorization', `Bearer ${ownerToken}`)
      .send({ name: 'YSK' });
    await request(app)
      .post(`/v1/organizations/${org.body.data.id}/invites`)
      .set('authorization', `Bearer ${ownerToken}`)
      .send({ email: 'late@ysk.hk', role: 'MEMBER' });
    const inviteJob = jobs.find((job) => job.name === 'email.send' && job.payload.vars?.inviteUrl);
    const inviteToken = new URL(inviteJob?.payload.vars?.inviteUrl ?? 'http://x').searchParams.get(
      'token',
    );
    await request(app)
      .post('/v1/organizations/invites/accept')
      .send({ token: inviteToken, password: 'password1' });
    const reused = await request(app)
      .post('/v1/organizations/invites/accept')
      .send({ token: inviteToken, password: 'password1' });
    expect(reused.status).toBe(401);
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
    const admin = await users.findByEmail('admin@ysk.hk');
    if (!admin) throw new Error('admin missing');
    admin.role = 'ADMIN';
    await users.save(admin);
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
    expect(sessions).toBeDefined();
  });

  it('blocks INVITED users from logging in even with a password', async () => {
    await users.create({
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
    const boss = await users.findByEmail('boss@ysk.hk');
    if (!boss) throw new Error('missing boss');
    boss.role = 'ADMIN';
    await users.save(boss);
    const unknown = await request(app)
      .post('/v1/auth/admin/otp/request')
      .send({ email: 'nobody@ysk.hk' });
    expect(unknown.status).toBe(200);
    expect(unknown.body.data.sent).toBe(true);
    const sent = await request(app)
      .post('/v1/auth/admin/otp/request')
      .send({ email: 'boss@ysk.hk' });
    expect(sent.status).toBe(200);
    const otpJob = jobs.find((job) => job.name === 'email.send' && job.payload.vars?.code);
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

  it('activates a subscription from a signed Stripe webhook', async () => {
    const missing = await request(app).post('/v1/billing/webhook').send({});
    expect(missing.status).toBe(404);
    const mem = createMemoryInput();
    const secret = 'whsec_test';
    const stripeApp = createApp({ ...mem.input, stripeWebhookSecret: secret });
    const registered = await request(stripeApp).post('/v1/auth/register').send({
      email: 'stripe@ysk.hk',
      password: 'password1',
      displayName: 'Stripe',
    });
    const jwt = registered.body.data.accessToken as string;
    const org = await request(stripeApp)
      .post('/v1/organizations')
      .set('authorization', `Bearer ${jwt}`)
      .send({ name: 'Pay' });
    const organizationId = org.body.data.id as string;
    const payload = JSON.stringify({
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_1',
          metadata: { organizationId, planCode: 'pro', seatCount: '2' },
        },
      },
    });
    const unsigned = await request(stripeApp)
      .post('/v1/billing/webhook')
      .set('content-type', 'application/json')
      .send(payload);
    expect(unsigned.status).toBe(401);
    const t = String(Math.floor(Date.now() / 1000));
    const v1 = createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
    const signed = await request(stripeApp)
      .post('/v1/billing/webhook')
      .set('content-type', 'application/json')
      .set('stripe-signature', `t=${t},v1=${v1}`)
      .send(payload);
    expect(signed.status).toBe(200);
    const sub = await request(stripeApp)
      .get(`/v1/billing/subscription?organizationId=${organizationId}`)
      .set('authorization', `Bearer ${jwt}`);
    expect(sub.body.data.planCode).toBe('pro');
    expect(sub.body.data.status).toBe('active');
    expect(sub.body.data.seatCount).toBe(2);
  });

  it('rejects Stripe portal before a customer exists', async () => {
    const mem = createMemoryInput();
    const billingService = createBillingService({
      subscriptions: createMemorySubscriptionRepository(),
      billing: createStripeBilling({
        secretKey: 'sk_test_x',
        pricePro: 'price_pro',
        fetchImpl: (async () => new Response('{}', { status: 500 })) as typeof fetch,
      }),
      orgs: mem.orgs,
    });
    const stripeApp = createApp({ ...mem.input, billingService });
    const registered = await request(stripeApp).post('/v1/auth/register').send({
      email: 'portal@ysk.hk',
      password: 'password1',
      displayName: 'Portal',
    });
    const jwt = registered.body.data.accessToken as string;
    const org = await request(stripeApp)
      .post('/v1/organizations')
      .set('authorization', `Bearer ${jwt}`)
      .send({ name: 'Portal Co' });
    const denied = await request(stripeApp)
      .post('/v1/billing/portal')
      .set('authorization', `Bearer ${jwt}`)
      .send({
        organizationId: org.body.data.id,
        returnUrl: 'http://localhost:5173/billing',
      });
    expect(denied.status).toBe(409);
  });

  it('hides bull board without queues and requires ADMIN when mounted', async () => {
    const missing = await request(app).get('/admin/queues');
    expect(missing.status).toBe(404);
    const mem = createMemoryInput();
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

  it('lists plans publicly and checks out a pro subscription', async () => {
    const plans = await request(app).get('/v1/billing/plans');
    expect(plans.status).toBe(200);
    expect(plans.body.data.some((row: { code: string }) => row.code === 'pro')).toBe(true);
    const denied = await request(app).post('/v1/billing/checkout').send({
      organizationId: '11111111-1111-4111-8111-111111111111',
      planCode: 'pro',
      successUrl: 'http://localhost:5173/ok',
      cancelUrl: 'http://localhost:5173/no',
    });
    expect(denied.status).toBe(401);
    const registered = await request(app).post('/v1/auth/register').send({
      email: 'pay@ysk.hk',
      password: 'password1',
      displayName: 'Pay',
    });
    const jwt = registered.body.data.accessToken as string;
    const org = await request(app)
      .post('/v1/organizations')
      .set('authorization', `Bearer ${jwt}`)
      .send({ name: 'Pay Co' });
    const organizationId = org.body.data.id as string;
    const me = await request(app)
      .get(`/v1/billing/subscription?organizationId=${organizationId}`)
      .set('authorization', `Bearer ${jwt}`);
    expect(me.body.data.planCode).toBe('free');
    expect(me.body.data.seatCount).toBe(1);
    const tooFewSeats = await request(app)
      .post('/v1/billing/checkout')
      .set('authorization', `Bearer ${jwt}`)
      .send({
        organizationId,
        planCode: 'pro',
        successUrl: 'http://localhost:5173/ok',
        cancelUrl: 'http://localhost:5173/no',
        seatCount: 0,
      });
    expect(tooFewSeats.status).toBe(422);
    const checkout = await request(app)
      .post('/v1/billing/checkout')
      .set('authorization', `Bearer ${jwt}`)
      .send({
        organizationId,
        planCode: 'pro',
        successUrl: 'http://localhost:5173/ok',
        cancelUrl: 'http://localhost:5173/no',
        seatCount: 2,
      });
    expect(checkout.status).toBe(200);
    expect(checkout.body.data.url).toContain('plan=pro');
    expect(checkout.body.data.url).toContain('seats=2');
    const sub = await request(app)
      .get(`/v1/billing/subscription?organizationId=${organizationId}`)
      .set('authorization', `Bearer ${jwt}`);
    expect(sub.body.data.planCode).toBe('pro');
    expect(sub.body.data.status).toBe('active');
    expect(sub.body.data.seatCount).toBe(2);
    const canceled = await request(app)
      .post('/v1/billing/cancel')
      .set('authorization', `Bearer ${jwt}`)
      .send({ organizationId });
    expect(canceled.status).toBe(200);
    const after = await request(app)
      .get(`/v1/billing/subscription?organizationId=${organizationId}`)
      .set('authorization', `Bearer ${jwt}`);
    expect(after.body.data.status).toBe('canceled');
    const portal = await request(app)
      .post('/v1/billing/portal')
      .set('authorization', `Bearer ${jwt}`)
      .send({ organizationId, returnUrl: 'http://localhost:5173/billing' });
    expect(portal.status).toBe(200);
    expect(portal.body.data.url).toContain('billing.local/portal');
    const invoices = await request(app)
      .get(`/v1/billing/invoices?organizationId=${organizationId}`)
      .set('authorization', `Bearer ${jwt}`);
    expect(invoices.status).toBe(200);
    expect(invoices.body.data).toEqual([]);
    const pdf = await request(app)
      .get(`/v1/billing/invoices/in_missing/pdf?organizationId=${organizationId}`)
      .set('authorization', `Bearer ${jwt}`)
      .redirects(0);
    expect(pdf.status).toBe(404);
  });

  it('forbids org MEMBER checkout and rejects seatCount below members', async () => {
    const ownerRes = await request(app).post('/v1/auth/register').send({
      email: 'bill-owner@ysk.hk',
      password: 'password1',
      displayName: 'Owner',
    });
    await request(app).post('/v1/auth/register').send({
      email: 'bill-member@ysk.hk',
      password: 'password1',
      displayName: 'Member',
    });
    const ownerToken = ownerRes.body.data.accessToken as string;
    const org = await request(app)
      .post('/v1/organizations')
      .set('authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Seats Co' });
    const organizationId = org.body.data.id as string;
    await request(app)
      .post(`/v1/organizations/${organizationId}/invites`)
      .set('authorization', `Bearer ${ownerToken}`)
      .send({ email: 'bill-member@ysk.hk', role: 'MEMBER' });
    const inviteJob = jobs.find((job) => job.name === 'email.send' && job.payload.vars?.inviteUrl);
    const inviteToken = new URL(inviteJob?.payload.vars?.inviteUrl ?? 'http://x').searchParams.get(
      'token',
    );
    await request(app).post('/v1/organizations/invites/accept').send({ token: inviteToken });
    const memberLogin = await request(app).post('/v1/auth/login').send({
      email: 'bill-member@ysk.hk',
      password: 'password1',
    });
    const memberDenied = await request(app)
      .post('/v1/billing/checkout')
      .set('authorization', `Bearer ${memberLogin.body.data.accessToken}`)
      .send({
        organizationId,
        planCode: 'pro',
        successUrl: 'http://localhost:5173/ok',
        cancelUrl: 'http://localhost:5173/no',
        seatCount: 2,
      });
    expect(memberDenied.status).toBe(403);
    const tooFew = await request(app)
      .post('/v1/billing/checkout')
      .set('authorization', `Bearer ${ownerToken}`)
      .send({
        organizationId,
        planCode: 'pro',
        successUrl: 'http://localhost:5173/ok',
        cancelUrl: 'http://localhost:5173/no',
        seatCount: 1,
      });
    expect(tooFew.status).toBe(422);
  });

  it('redirects to an invoice PDF when the port returns a URL', async () => {
    const mem = createMemoryInput();
    const log = createLogBilling();
    const billingService = createBillingService({
      subscriptions: createMemorySubscriptionRepository(),
      billing: {
        checkout: (input) => log.checkout(input),
        portal: (input) => log.portal(input),
        listInvoices: (input) => log.listInvoices(input),
        getInvoicePdf: async () => ({ url: 'https://files.stripe.com/x.pdf' }),
      },
      orgs: mem.orgs,
    });
    const pdfApp = createApp({ ...mem.input, billingService });
    const registered = await request(pdfApp).post('/v1/auth/register').send({
      email: 'pdf@ysk.hk',
      password: 'password1',
      displayName: 'Pdf',
    });
    const org = await mem.orgs.createWithOwner({
      name: 'Pdf Co',
      ownerUserId: registered.body.data.user.id as string,
    });
    await billingService.activate(org.id, 'pro', 'cus_1', 1);
    const pdf = await request(pdfApp)
      .get(`/v1/billing/invoices/in_1/pdf?organizationId=${org.id}`)
      .set('authorization', `Bearer ${registered.body.data.accessToken}`)
      .redirects(0);
    expect(pdf.status).toBe(302);
    expect(pdf.headers.location).toBe('https://files.stripe.com/x.pdf');
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
      .send({ name: 'ci', permissions: ['llm.use'] });
    expect(created.status).toBe(201);
    const token = created.body.data.token as string;
    expect(token.startsWith('ysk_live_')).toBe(true);
    const list = await request(app).get('/v1/me/api-keys').set('authorization', `Bearer ${jwt}`);
    expect(list.body.data[0].last4).toHaveLength(4);
    expect(JSON.stringify(list.body)).not.toContain(token);
    const llm = await request(app)
      .post('/v1/llm/complete')
      .set('authorization', `Bearer ${token}`)
      .send({ messages: [{ role: 'user', content: 'ping' }] });
    expect(llm.status).toBe(200);
    const manage = await request(app)
      .post('/v1/me/api-keys')
      .set('authorization', `Bearer ${token}`)
      .send({ name: 'nope', permissions: ['llm.use'] });
    expect(manage.status).toBe(403);
  });

  it('forbids API keys without llm.use from completing', async () => {
    const registered = await request(app).post('/v1/auth/register').send({
      email: 'filekey@ysk.hk',
      password: 'password1',
      displayName: 'File',
    });
    const jwt = registered.body.data.accessToken as string;
    const created = await request(app)
      .post('/v1/me/api-keys')
      .set('authorization', `Bearer ${jwt}`)
      .send({ name: 'files', permissions: ['file.upload'] });
    const token = created.body.data.token as string;
    const llm = await request(app)
      .post('/v1/llm/complete')
      .set('authorization', `Bearer ${token}`)
      .send({ messages: [{ role: 'user', content: 'ping' }] });
    expect(llm.status).toBe(403);
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
      .send({ name: 'tmp', permissions: ['llm.use'] });
    const id = created.body.data.id as string;
    const token = created.body.data.token as string;
    await request(app).delete(`/v1/me/api-keys/${id}`).set('authorization', `Bearer ${jwt}`);
    const me = await request(app).get('/v1/me').set('authorization', `Bearer ${token}`);
    expect(me.status).toBe(401);
  });
});
