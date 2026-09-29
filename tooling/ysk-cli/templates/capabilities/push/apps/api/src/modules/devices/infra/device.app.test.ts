import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../../app';
import { createMemoryInput } from '../../../create-memory-input';

describe('devices http', () => {
  it('registers a device without exposing the full token and pushes on notify', async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
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
    expect(mem.push.sink.some((row) => row.title === '重設密碼')).toBe(true);
  });

  it('rejects devices without a token', async () => {
    const app = createApp(createMemoryInput().input);
    const res = await request(app).get('/v1/me/devices');
    expect(res.status).toBe(401);
  });
});
