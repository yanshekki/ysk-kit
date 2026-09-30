import type { AppError } from '@ysk-kit/domain-kernel';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../../app';
import { createMemoryInput } from '../../../create-memory-input';
import { createAppointmentService } from '../application/appointment-service';
import { createMemoryAppointmentRepository } from './memory-appointment-repository';

const AUTHOR = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';
const FUTURE = '2035-03-01T02:00:00.000Z';
const FUTURE_B = '2035-03-01T02:15:00.000Z';
const PAST = '2020-01-01T02:00:00.000Z';

const valid = {
  patientName: 'Chan Tai Man',
  phone: '+85291234567',
  startsAt: FUTURE,
  durationMin: 30,
};

describe('appointment service', () => {
  it('creates and lists rows for the author', async () => {
    const frozen = new Date('2030-01-01T00:00:00.000Z');
    const service = createAppointmentService(createMemoryAppointmentRepository(), {
      now: () => frozen,
    });
    const created = await service.create(AUTHOR, valid);
    expect(created.patientName).toBe('Chan Tai Man');
    expect(created.status).toBe('SCHEDULED');
    const page = await service.list(AUTHOR, { limit: 20 });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.id).toBe(created.id);
    const other = await service.list(OTHER, { limit: 20 });
    expect(other.items).toHaveLength(0);
  });

  it('rejects a start in the past', async () => {
    const frozen = new Date('2030-01-01T00:00:00.000Z');
    const service = createAppointmentService(createMemoryAppointmentRepository(), {
      now: () => frozen,
    });
    await expect(service.create(AUTHOR, { ...valid, startsAt: PAST })).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    } satisfies Partial<AppError>);
  });

  it('rejects an overlapping scheduled slot', async () => {
    const frozen = new Date('2030-01-01T00:00:00.000Z');
    const service = createAppointmentService(createMemoryAppointmentRepository(), {
      now: () => frozen,
    });
    await service.create(AUTHOR, valid);
    await expect(service.create(AUTHOR, { ...valid, startsAt: FUTURE_B })).rejects.toMatchObject({
      code: 'CONFLICT',
    } satisfies Partial<AppError>);
    await expect(service.create(OTHER, valid)).resolves.toMatchObject({ status: 'SCHEDULED' });
  });

  it('allows a slot that starts when the previous one ends', async () => {
    const frozen = new Date('2030-01-01T00:00:00.000Z');
    const service = createAppointmentService(createMemoryAppointmentRepository(), {
      now: () => frozen,
    });
    await service.create(AUTHOR, valid);
    const adjacent = await service.create(AUTHOR, {
      ...valid,
      patientName: 'Lee Ka Ming',
      startsAt: '2035-03-01T02:30:00.000Z',
    });
    expect(adjacent.status).toBe('SCHEDULED');
  });

  it('cancels SCHEDULED and refuses DONE', async () => {
    const frozen = new Date('2030-01-01T00:00:00.000Z');
    const service = createAppointmentService(createMemoryAppointmentRepository(), {
      now: () => frozen,
    });
    const created = await service.create(AUTHOR, valid);
    const cancelled = await service.cancel(AUTHOR, created.id);
    expect(cancelled.status).toBe('CANCELLED');
    await expect(service.cancel(AUTHOR, created.id)).rejects.toMatchObject({ code: 'CONFLICT' });
    const other = await service.create(AUTHOR, {
      ...valid,
      startsAt: '2035-03-02T02:00:00.000Z',
    });
    const done = await service.complete(AUTHOR, other.id);
    expect(done.status).toBe('DONE');
    await expect(service.cancel(AUTHOR, other.id)).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(
      service.cancel(AUTHOR, '33333333-3333-4333-a333-333333333333'),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(service.cancel(OTHER, created.id)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('appointment HTTP', () => {
  const tokenOf = async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const registered = await request(app).post('/v1/auth/register').send({
      email: 'clinic@ysk.hk',
      password: 'password1',
      displayName: 'Clinic',
    });
    expect(registered.status).toBe(201);
    return { app, token: registered.body.data.accessToken as string };
  };

  it('returns the success envelope', async () => {
    const { app, token } = await tokenOf();
    const res = await request(app)
      .post('/v1/appointment')
      .set('authorization', `Bearer ${token}`)
      .send(valid);
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.patientName).toBe('Chan Tai Man');
    expect(res.body.data.phone).toBe('+85291234567');
    expect(res.body.data.durationMin).toBe(30);
    expect(res.body.data.status).toBe('SCHEDULED');
  });

  it('returns VALIDATION_FAILED for a past start', async () => {
    const { app, token } = await tokenOf();
    const res = await request(app)
      .post('/v1/appointment')
      .set('authorization', `Bearer ${token}`)
      .send({ ...valid, startsAt: PAST });
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
  });

  it('returns CONFLICT for an overlapping slot', async () => {
    const { app, token } = await tokenOf();
    const first = await request(app)
      .post('/v1/appointment')
      .set('authorization', `Bearer ${token}`)
      .send(valid);
    expect(first.status).toBe(201);
    const res = await request(app)
      .post('/v1/appointment')
      .set('authorization', `Bearer ${token}`)
      .send({ ...valid, patientName: 'Lee Ka Ming', startsAt: FUTURE_B });
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'CONFLICT' } });
  });

  it('returns UNAUTHENTICATED without a session', async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const res = await request(app).post('/v1/appointment').send(valid);
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'UNAUTHENTICATED' } });
  });
});
