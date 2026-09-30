import type { AppError } from '@ysk-kit/domain-kernel';
import type { IJobQueue } from '@ysk-kit/jobs';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../../app';
import { createMemoryInput } from '../../../create-memory-input';
import { createWorkOrderService } from '../application/work-order-service';
import { createMemoryWorkOrderRepository } from './memory-work-order-repository';

const AUTHOR = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';
const valid = { title: 'Fix AC', address: '18 Harbour Road' };

describe('work-order service', () => {
  it('creates NEW rows for the author', async () => {
    const service = createWorkOrderService(createMemoryWorkOrderRepository());
    const created = await service.create(AUTHOR, valid);
    expect(created.title).toBe('Fix AC');
    expect(created.address).toBe('18 Harbour Road');
    expect(created.status).toBe('NEW');
    expect((await service.list(AUTHOR, { limit: 20 })).items).toHaveLength(1);
    expect((await service.list(OTHER, { limit: 20 })).items).toHaveLength(0);
  });

  it('assigns NEW to ASSIGNED and enqueues notification.create', async () => {
    const enqueue = vi.fn(async () => 'job-1');
    const jobs = { enqueue } as unknown as IJobQueue;
    const service = createWorkOrderService(createMemoryWorkOrderRepository(), jobs);
    const created = await service.create(AUTHOR, valid);
    const assigned = await service.assign(AUTHOR, created.id);
    expect(assigned.status).toBe('ASSIGNED');
    expect(enqueue).toHaveBeenCalledWith('notification.create', {
      userId: AUTHOR,
      type: 'work.assigned',
      title: 'Fix AC',
      body: 'Assigned: 18 Harbour Road',
    });
    await expect(service.assign(AUTHOR, created.id)).rejects.toMatchObject({
      code: 'CONFLICT',
    } satisfies Partial<AppError>);
    await expect(service.assign(OTHER, created.id)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    } satisfies Partial<AppError>);
  });

  it('completes ASSIGNED to DONE', async () => {
    const service = createWorkOrderService(createMemoryWorkOrderRepository());
    const created = await service.create(AUTHOR, valid);
    await expect(service.complete(AUTHOR, created.id)).rejects.toMatchObject({
      code: 'CONFLICT',
    } satisfies Partial<AppError>);
    await service.assign(AUTHOR, created.id);
    const done = await service.complete(AUTHOR, created.id);
    expect(done.status).toBe('DONE');
  });
});

describe('work-order HTTP', () => {
  const tokenOf = async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const registered = await request(app).post('/v1/auth/register').send({
      email: 'field@ysk.hk',
      password: 'password1',
      displayName: 'Field',
    });
    expect(registered.status).toBe(201);
    return { app, token: registered.body.data.accessToken as string };
  };

  it('returns the success envelope', async () => {
    const { app, token } = await tokenOf();
    const res = await request(app)
      .post('/v1/work-order')
      .set('authorization', `Bearer ${token}`)
      .send(valid);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      ok: true,
      data: { title: 'Fix AC', address: '18 Harbour Road', status: 'NEW' },
    });
  });

  it('returns VALIDATION_FAILED for an empty title', async () => {
    const { app, token } = await tokenOf();
    const res = await request(app)
      .post('/v1/work-order')
      .set('authorization', `Bearer ${token}`)
      .send({ title: '', address: '18 Harbour Road' });
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
  });

  it('assigns with HTTP 200 and status ASSIGNED', async () => {
    const { app, token } = await tokenOf();
    const created = await request(app)
      .post('/v1/work-order')
      .set('authorization', `Bearer ${token}`)
      .send(valid);
    const assigned = await request(app)
      .post(`/v1/work-order/${created.body.data.id}/assign`)
      .set('authorization', `Bearer ${token}`)
      .send({});
    expect(assigned.status).toBe(200);
    expect(assigned.body).toMatchObject({
      ok: true,
      data: { title: 'Fix AC', address: '18 Harbour Road', status: 'ASSIGNED' },
    });
  });

  it('returns UNAUTHENTICATED without a session', async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const res = await request(app).post('/v1/work-order').send(valid);
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'UNAUTHENTICATED' } });
  });
});
