import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../../app';
import { createMemoryInput } from '../../../create-memory-input';

describe('llm http', () => {
  it('completes llm as a signed-in user and records usage', async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
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
    expect(mem.usage.rows).toHaveLength(1);
  });

  it('rejects llm without a token', async () => {
    const app = createApp(createMemoryInput().input);
    const res = await request(app)
      .post('/v1/llm/complete')
      .send({ messages: [{ role: 'user', content: 'ping' }] });
    expect(res.status).toBe(401);
  });

  it('streams llm deltas then done', async () => {
    const app = createApp(createMemoryInput().input);
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

  it('allows an API key with llm.use to complete', async () => {
    const app = createApp(createMemoryInput().input);
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
    const token = created.body.data.token as string;
    const llm = await request(app)
      .post('/v1/llm/complete')
      .set('authorization', `Bearer ${token}`)
      .send({ messages: [{ role: 'user', content: 'ping' }] });
    expect(llm.status).toBe(200);
  });

  it('forbids API keys without llm.use from completing', async () => {
    const app = createApp(createMemoryInput().input);
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
});
