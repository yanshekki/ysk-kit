import type { AppError } from '@ysk-kit/domain-kernel';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../../app';
import { createMemoryInput } from '../../../create-memory-input';
import { createEventService } from '../application/event-service';
import { createMemoryEventRepository } from './memory-event-repository';

const AUTHOR = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';
const valid = {
  title: 'Harbour Talk',
  venue: 'Central',
  startsAt: '2035-03-01T02:00:00.000Z',
  capacity: 20,
};

describe('event service', () => {
  it('creates and lists rows for the author', async () => {
    const service = createEventService(createMemoryEventRepository());
    const created = await service.create(AUTHOR, valid);
    expect(created.title).toBe('Harbour Talk');
    expect(created.venue).toBe('Central');
    expect(created.capacity).toBe(20);
    expect((await service.list(AUTHOR, { limit: 20 })).items).toHaveLength(1);
    expect((await service.list(OTHER, { limit: 20 })).items).toHaveLength(0);
  });

  it('rejects a non-positive capacity', async () => {
    const service = createEventService(createMemoryEventRepository());
    await expect(service.create(AUTHOR, { ...valid, capacity: 0 })).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    } satisfies Partial<AppError>);
  });
});

describe('event HTTP', () => {
  const tokenOf = async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const registered = await request(app).post('/v1/auth/register').send({
      email: 'event@ysk.hk',
      password: 'password1',
      displayName: 'Event',
    });
    expect(registered.status).toBe(201);
    return { app, token: registered.body.data.accessToken as string };
  };

  it('returns the success envelope', async () => {
    const { app, token } = await tokenOf();
    const res = await request(app)
      .post('/v1/event')
      .set('authorization', `Bearer ${token}`)
      .send(valid);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      ok: true,
      data: { title: 'Harbour Talk', venue: 'Central', capacity: 20 },
    });
  });

  it('returns VALIDATION_FAILED for capacity 0', async () => {
    const { app, token } = await tokenOf();
    const res = await request(app)
      .post('/v1/event')
      .set('authorization', `Bearer ${token}`)
      .send({ ...valid, capacity: 0 });
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
  });

  it('returns UNAUTHENTICATED without a session', async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const res = await request(app).post('/v1/event').send(valid);
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'UNAUTHENTICATED' } });
  });
});
