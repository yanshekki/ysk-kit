import type { AppError } from '@ysk/domain-kernel';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../../app';
import { createMemoryInput } from '../../../create-memory-input';
import { createFollowUpService } from '../../follow-up/application/follow-up-service';
import { createMemoryFollowUpRepository } from '../../follow-up/infra/memory-follow-up-repository';
import { createContactService } from '../application/contact-service';
import { createMemoryContactRepository } from './memory-contact-repository';

const AUTHOR = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';
const valid = {
  name: 'Chan Tai Man',
  email: 'chan@ysk.hk',
  phone: '+85291234567',
  company: 'YSK Limited',
};

describe('contact service', () => {
  it('creates a LEAD and lists it for the author only', async () => {
    const service = createContactService(createMemoryContactRepository());
    const created = await service.create(AUTHOR, valid);
    expect(created.status).toBe('LEAD');
    expect(created.email).toBe('chan@ysk.hk');
    expect((await service.list(AUTHOR, { limit: 20 })).items).toHaveLength(1);
    expect((await service.list(OTHER, { limit: 20 })).items).toHaveLength(0);
  });

  it('rejects a duplicate email for the same author', async () => {
    const service = createContactService(createMemoryContactRepository());
    await service.create(AUTHOR, valid);
    await expect(service.create(AUTHOR, { ...valid, name: 'Other' })).rejects.toMatchObject({
      code: 'CONFLICT',
    } satisfies Partial<AppError>);
    await expect(service.create(OTHER, valid)).resolves.toMatchObject({ status: 'LEAD' });
  });
});

describe('follow-up service', () => {
  it('creates a follow-up on an owned contact', async () => {
    const contacts = createMemoryContactRepository();
    const contact = await createContactService(contacts).create(AUTHOR, valid);
    const service = createFollowUpService(createMemoryFollowUpRepository(contacts));
    const row = await service.create(AUTHOR, {
      contactId: contact.id,
      dueAt: '2035-03-01T02:00:00.000Z',
      note: 'Call back about the proposal',
    });
    expect(row.note).toBe('Call back about the proposal');
  });

  it('rejects a missing or foreign contact', async () => {
    const contacts = createMemoryContactRepository();
    const contact = await createContactService(contacts).create(AUTHOR, valid);
    const service = createFollowUpService(createMemoryFollowUpRepository(contacts));
    await expect(
      service.create(AUTHOR, {
        contactId: '33333333-3333-4333-a333-333333333333',
        dueAt: '2035-03-01T02:00:00.000Z',
        note: 'Nope',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' } satisfies Partial<AppError>);
    await expect(
      service.create(OTHER, {
        contactId: contact.id,
        dueAt: '2035-03-01T02:00:00.000Z',
        note: 'Nope',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' } satisfies Partial<AppError>);
  });
});

describe('contact HTTP', () => {
  const tokenOf = async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const registered = await request(app).post('/v1/auth/register').send({
      email: 'crm@ysk.hk',
      password: 'password1',
      displayName: 'Crm',
    });
    expect(registered.status).toBe(201);
    return { app, token: registered.body.data.accessToken as string };
  };

  it('returns the success envelope', async () => {
    const { app, token } = await tokenOf();
    const res = await request(app)
      .post('/v1/contact')
      .set('authorization', `Bearer ${token}`)
      .send(valid);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      ok: true,
      data: { name: 'Chan Tai Man', email: 'chan@ysk.hk', status: 'LEAD' },
    });
  });

  it('returns VALIDATION_FAILED for a bad email', async () => {
    const { app, token } = await tokenOf();
    const res = await request(app)
      .post('/v1/contact')
      .set('authorization', `Bearer ${token}`)
      .send({ ...valid, email: 'not-an-email' });
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
  });

  it('returns CONFLICT for a duplicate email', async () => {
    const { app, token } = await tokenOf();
    await request(app).post('/v1/contact').set('authorization', `Bearer ${token}`).send(valid);
    const res = await request(app)
      .post('/v1/contact')
      .set('authorization', `Bearer ${token}`)
      .send(valid);
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'CONFLICT' } });
  });

  it('returns UNAUTHENTICATED without a session', async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const res = await request(app).post('/v1/contact').send(valid);
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'UNAUTHENTICATED' } });
  });

  it('creates a follow-up and rejects a missing contact', async () => {
    const { app, token } = await tokenOf();
    const created = await request(app)
      .post('/v1/contact')
      .set('authorization', `Bearer ${token}`)
      .send(valid);
    const ok = await request(app)
      .post('/v1/follow-up')
      .set('authorization', `Bearer ${token}`)
      .send({
        contactId: created.body.data.id,
        dueAt: '2035-03-01T02:00:00.000Z',
        note: 'Call back about the proposal',
      });
    expect(ok.status).toBe(201);
    const missing = await request(app)
      .post('/v1/follow-up')
      .set('authorization', `Bearer ${token}`)
      .send({
        contactId: '33333333-3333-4333-a333-333333333333',
        dueAt: '2035-03-01T02:00:00.000Z',
        note: 'Nope',
      });
    expect(missing.status).toBe(404);
    expect(missing.body).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
  });
});
