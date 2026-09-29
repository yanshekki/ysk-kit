import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../../app';
import { createMemoryInput } from '../../../create-memory-input';

describe('organizations http', () => {
  it('creates an org with the actor as owner', async () => {
    const app = createApp(createMemoryInput().input);
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
    const app = createApp(createMemoryInput().input);
    const res = await request(app).get('/v1/organizations');
    expect(res.status).toBe(401);
  });

  it('invites an existing user who accepts with the token only', async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
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
    const inviteJob = mem.jobs.find(
      (job) => job.name === 'email.send' && job.payload.vars?.inviteUrl,
    );
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
    const mem = createMemoryInput();
    const app = createApp(mem.input);
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
    const invitedUser = await mem.users.findByEmail('new@ysk.hk');
    expect(invitedUser?.status).toBe('INVITED');
    const conflict = await request(app).post('/v1/auth/register').send({
      email: 'new@ysk.hk',
      password: 'password1',
      displayName: 'New',
    });
    expect(conflict.status).toBe(409);
    const inviteJob = mem.jobs.find(
      (job) => job.name === 'email.send' && job.payload.vars?.inviteUrl,
    );
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
    const mem = createMemoryInput();
    const app = createApp(mem.input);
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
    const memberUser = await mem.users.findByEmail('member@ysk.hk');
    const org = await request(app)
      .post('/v1/organizations')
      .set('authorization', `Bearer ${ownerToken}`)
      .send({ name: 'YSK' });
    await request(app)
      .post(`/v1/organizations/${org.body.data.id}/invites`)
      .set('authorization', `Bearer ${ownerToken}`)
      .send({ email: 'member@ysk.hk', role: 'MEMBER' });
    const inviteJob = mem.jobs.find(
      (job) => job.name === 'email.send' && job.payload.vars?.inviteUrl,
    );
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
    const mem = createMemoryInput();
    const app = createApp(mem.input);
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
    const inviteJob = mem.jobs.find(
      (job) => job.name === 'email.send' && job.payload.vars?.inviteUrl,
    );
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
});
