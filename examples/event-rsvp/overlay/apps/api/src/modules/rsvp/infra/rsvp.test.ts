import type { AppError } from '@ysk-kit/domain-kernel';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../../app';
import { createMemoryInput } from '../../../create-memory-input';
import { createEventService } from '../../event/application/event-service';
import { createMemoryEventRepository } from '../../event/infra/memory-event-repository';
import { createRsvpService } from '../application/rsvp-service';
import { createMemoryRsvpRepository } from './memory-rsvp-repository';

const AUTHOR = '11111111-1111-1111-1111-111111111111';
const eventInput = {
  title: 'Harbour Talk',
  venue: 'Central',
  startsAt: '2035-03-01T02:00:00.000Z',
  capacity: 1,
};

describe('rsvp service', () => {
  it('creates an RSVP on an existing event', async () => {
    const events = createMemoryEventRepository();
    const event = await createEventService(events).create(AUTHOR, eventInput);
    const service = createRsvpService(createMemoryRsvpRepository(events));
    const row = await service.create(AUTHOR, {
      eventId: event.id,
      attendeeName: 'Chan Tai Man',
      email: 'chan@ysk.hk',
    });
    expect(row.attendeeName).toBe('Chan Tai Man');
    expect(row.email).toBe('chan@ysk.hk');
  });

  it('rejects a missing event', async () => {
    const service = createRsvpService(createMemoryRsvpRepository(createMemoryEventRepository()));
    await expect(
      service.create(AUTHOR, {
        eventId: '33333333-3333-4333-a333-333333333333',
        attendeeName: 'Chan Tai Man',
        email: 'chan@ysk.hk',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' } satisfies Partial<AppError>);
  });

  it('rejects a duplicate email for the same event', async () => {
    const events = createMemoryEventRepository();
    const event = await createEventService(events).create(AUTHOR, {
      ...eventInput,
      capacity: 20,
    });
    const service = createRsvpService(createMemoryRsvpRepository(events));
    const body = {
      eventId: event.id,
      attendeeName: 'Chan Tai Man',
      email: 'chan@ysk.hk',
    };
    await service.create(AUTHOR, body);
    await expect(service.create(AUTHOR, { ...body, attendeeName: 'Other' })).rejects.toMatchObject({
      code: 'CONFLICT',
    } satisfies Partial<AppError>);
  });

  it('rejects RSVP when the event is full', async () => {
    const events = createMemoryEventRepository();
    const event = await createEventService(events).create(AUTHOR, eventInput);
    const service = createRsvpService(createMemoryRsvpRepository(events));
    await service.create(AUTHOR, {
      eventId: event.id,
      attendeeName: 'Chan Tai Man',
      email: 'chan@ysk.hk',
    });
    await expect(
      service.create(AUTHOR, {
        eventId: event.id,
        attendeeName: 'Lee Ka Ming',
        email: 'lee@ysk.hk',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' } satisfies Partial<AppError>);
  });
});

describe('rsvp HTTP', () => {
  const tokenOf = async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const registered = await request(app).post('/v1/auth/register').send({
      email: 'rsvp@ysk.hk',
      password: 'password1',
      displayName: 'Rsvp',
    });
    expect(registered.status).toBe(201);
    return { app, token: registered.body.data.accessToken as string };
  };

  it('creates an RSVP and rejects a missing event', async () => {
    const { app, token } = await tokenOf();
    const created = await request(app)
      .post('/v1/event')
      .set('authorization', `Bearer ${token}`)
      .send({ ...eventInput, capacity: 20 });
    expect(created.status).toBe(201);
    const ok = await request(app).post('/v1/rsvp').set('authorization', `Bearer ${token}`).send({
      eventId: created.body.data.id,
      attendeeName: 'Chan Tai Man',
      email: 'chan@ysk.hk',
    });
    expect(ok.status).toBe(201);
    const missing = await request(app)
      .post('/v1/rsvp')
      .set('authorization', `Bearer ${token}`)
      .send({
        eventId: '33333333-3333-4333-a333-333333333333',
        attendeeName: 'Chan Tai Man',
        email: 'chan@ysk.hk',
      });
    expect(missing.status).toBe(404);
    expect(missing.body).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
  });

  it('returns CONFLICT for a duplicate email', async () => {
    const { app, token } = await tokenOf();
    const created = await request(app)
      .post('/v1/event')
      .set('authorization', `Bearer ${token}`)
      .send({ ...eventInput, capacity: 20 });
    const body = {
      eventId: created.body.data.id,
      attendeeName: 'Chan Tai Man',
      email: 'chan@ysk.hk',
    };
    await request(app).post('/v1/rsvp').set('authorization', `Bearer ${token}`).send(body);
    const res = await request(app)
      .post('/v1/rsvp')
      .set('authorization', `Bearer ${token}`)
      .send(body);
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'CONFLICT' } });
  });

  it('returns UNAUTHENTICATED without a session', async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const res = await request(app).post('/v1/rsvp').send({
      eventId: '33333333-3333-4333-a333-333333333333',
      attendeeName: 'Chan Tai Man',
      email: 'chan@ysk.hk',
    });
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'UNAUTHENTICATED' } });
  });
});
