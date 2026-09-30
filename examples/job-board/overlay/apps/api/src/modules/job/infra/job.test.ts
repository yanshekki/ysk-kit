import type { AppError } from '@ysk-kit/domain-kernel';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../../app';
import { createMemoryInput } from '../../../create-memory-input';
import { createJobService } from '../application/job-service';
import { createMemoryJobRepository } from './memory-job-repository';

const AUTHOR = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';
const valid = { title: 'React engineer', department: 'Product' };

describe('job service', () => {
  it('creates unpublished rows for the author', async () => {
    const service = createJobService(createMemoryJobRepository());
    const created = await service.create(AUTHOR, valid);
    expect(created.title).toBe('React engineer');
    expect(created.department).toBe('Product');
    expect(created.published).toBe(false);
    expect((await service.list(AUTHOR, { limit: 20 })).items).toHaveLength(1);
    expect((await service.list(OTHER, { limit: 20 })).items).toHaveLength(0);
  });

  it('publishes an unpublished job and rejects a second publish', async () => {
    const service = createJobService(createMemoryJobRepository());
    const created = await service.create(AUTHOR, valid);
    const published = await service.publish(AUTHOR, created.id);
    expect(published.published).toBe(true);
    await expect(service.publish(AUTHOR, created.id)).rejects.toMatchObject({
      code: 'CONFLICT',
    } satisfies Partial<AppError>);
    await expect(service.publish(OTHER, created.id)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    } satisfies Partial<AppError>);
  });
});

describe('job HTTP', () => {
  const tokenOf = async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const registered = await request(app).post('/v1/auth/register').send({
      email: 'jobs@ysk.hk',
      password: 'password1',
      displayName: 'Jobs',
    });
    expect(registered.status).toBe(201);
    return { app, token: registered.body.data.accessToken as string };
  };

  it('returns the success envelope unpublished', async () => {
    const { app, token } = await tokenOf();
    const res = await request(app)
      .post('/v1/job')
      .set('authorization', `Bearer ${token}`)
      .send(valid);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      ok: true,
      data: { title: 'React engineer', department: 'Product', published: false },
    });
  });

  it('returns VALIDATION_FAILED for an empty title', async () => {
    const { app, token } = await tokenOf();
    const res = await request(app)
      .post('/v1/job')
      .set('authorization', `Bearer ${token}`)
      .send({ title: '', department: 'Product' });
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
  });

  it('publishes then CONFLICT on a second publish', async () => {
    const { app, token } = await tokenOf();
    const created = await request(app)
      .post('/v1/job')
      .set('authorization', `Bearer ${token}`)
      .send(valid);
    const published = await request(app)
      .post(`/v1/job/${created.body.data.id}/publish`)
      .set('authorization', `Bearer ${token}`)
      .send({});
    expect(published.status).toBe(200);
    expect(published.body.data.published).toBe(true);
    const again = await request(app)
      .post(`/v1/job/${created.body.data.id}/publish`)
      .set('authorization', `Bearer ${token}`)
      .send({});
    expect(again.status).toBe(409);
    expect(again.body).toMatchObject({ ok: false, error: { code: 'CONFLICT' } });
  });

  it('returns UNAUTHENTICATED without a session', async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const res = await request(app).post('/v1/job').send(valid);
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'UNAUTHENTICATED' } });
  });
});
