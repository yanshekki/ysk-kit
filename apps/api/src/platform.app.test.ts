import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { createMemoryInput } from './create-memory-input';

describe('files, api keys, audit', () => {
  let mem: ReturnType<typeof createMemoryInput>;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    mem = createMemoryInput();
    app = createApp(mem.input);
  });

  const register = async (email: string) => {
    const res = await request(app).post('/v1/auth/register').send({
      email,
      password: 'password1',
      displayName: 'Ki',
    });
    return res.body.data.accessToken as string;
  };

  it('presigns an upload for USER', async () => {
    const token = await register('file@ysk.hk');
    const res = await request(app)
      .post('/v1/files/presign')
      .set('authorization', `Bearer ${token}`)
      .send({ mime: 'text/plain', byteSize: 12, filename: 'a.txt' });
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.uploadUrl).toContain('http://localhost:3001');
  });

  it('mints, lists, and revokes an API key', async () => {
    const token = await register('key@ysk.hk');
    const created = await request(app)
      .post('/v1/me/api-keys')
      .set('authorization', `Bearer ${token}`)
      .send({ name: 'ci', permissions: ['file.upload'] });
    expect(created.status).toBe(201);
    expect(created.body.data.token).toMatch(/^ysk_/);
    const list = await request(app).get('/v1/me/api-keys').set('authorization', `Bearer ${token}`);
    expect(list.body.data).toHaveLength(1);
    const revoked = await request(app)
      .delete(`/v1/me/api-keys/${created.body.data.id}`)
      .set('authorization', `Bearer ${token}`);
    expect(revoked.status).toBe(200);
    expect(revoked.body.data.revoked).toBe(true);
  });

  it('lists audit logs for ADMIN', async () => {
    const token = await register('audit@ysk.hk');
    const user = await mem.users.findByEmail('audit@ysk.hk');
    if (!user) throw new Error('missing');
    user.role = 'ADMIN';
    await mem.users.save(user);
    const login = await request(app).post('/v1/auth/login').send({
      email: 'audit@ysk.hk',
      password: 'password1',
    });
    const adminToken = login.body.data.accessToken as string;
    const res = await request(app)
      .get('/v1/audit-logs')
      .set('authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThan(0);
    const forbidden = await request(app)
      .get('/v1/audit-logs')
      .set('authorization', `Bearer ${token}`);
    expect(forbidden.status).toBe(403);
  });
});
