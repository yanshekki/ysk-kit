import type { AppError } from '@ysk/domain-kernel';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../../app';
import { createMemoryInput } from '../../../create-memory-input';
import { createTicketService } from '../application/ticket-service';
import { createMemoryTicketRepository } from './memory-ticket-repository';

const AUTHOR = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';
const ORG = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const valid = {
  title: 'Printer jam',
  body: '3F copier',
  organizationId: ORG,
};

describe('ticket service', () => {
  it('creates an OPEN ticket and lists it for members of the org', async () => {
    const repo = createMemoryTicketRepository();
    repo.seedMembership(AUTHOR, ORG, 'OWNER');
    const service = createTicketService(repo);
    const created = await service.create(AUTHOR, valid);
    expect(created.title).toBe('Printer jam');
    expect(created.status).toBe('OPEN');
    const page = await service.list(AUTHOR, { organizationId: ORG, limit: 20 });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.id).toBe(created.id);
  });

  it('rejects create and list without membership', async () => {
    const service = createTicketService(createMemoryTicketRepository());
    await expect(service.create(AUTHOR, valid)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    } satisfies Partial<AppError>);
    await expect(service.list(AUTHOR, { organizationId: ORG, limit: 20 })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    } satisfies Partial<AppError>);
  });

  it('lets MEMBER set PENDING and forbids RESOLVED', async () => {
    const repo = createMemoryTicketRepository();
    repo.seedMembership(AUTHOR, ORG, 'MEMBER');
    const service = createTicketService(repo);
    const created = await service.create(AUTHOR, valid);
    const pending = await service.status(AUTHOR, created.id, { status: 'PENDING' });
    expect(pending.status).toBe('PENDING');
    await expect(service.status(AUTHOR, created.id, { status: 'RESOLVED' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    } satisfies Partial<AppError>);
  });

  it('lets OWNER resolve a ticket', async () => {
    const repo = createMemoryTicketRepository();
    repo.seedMembership(AUTHOR, ORG, 'OWNER');
    const service = createTicketService(repo);
    const created = await service.create(AUTHOR, valid);
    const resolved = await service.status(AUTHOR, created.id, { status: 'RESOLVED' });
    expect(resolved.status).toBe('RESOLVED');
    await expect(
      service.status(AUTHOR, '33333333-3333-4333-a333-333333333333', { status: 'PENDING' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' } satisfies Partial<AppError>);
  });

  it('forbids another user from creating in the same org', async () => {
    const repo = createMemoryTicketRepository();
    repo.seedMembership(AUTHOR, ORG, 'OWNER');
    const service = createTicketService(repo);
    await expect(service.create(OTHER, valid)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    } satisfies Partial<AppError>);
  });
});

describe('ticket HTTP', () => {
  const appOf = async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const registered = await request(app).post('/v1/auth/register').send({
      email: 'helpdesk@ysk.hk',
      password: 'password1',
      displayName: 'Helpdesk',
    });
    expect(registered.status).toBe(201);
    const token = registered.body.data.accessToken as string;
    const org = await request(app)
      .post('/v1/organizations')
      .set('authorization', `Bearer ${token}`)
      .send({ name: 'Acme Support' });
    expect(org.status).toBe(201);
    return { app, token, organizationId: org.body.data.id as string };
  };

  it('returns the success envelope after creating an org', async () => {
    const { app, token, organizationId } = await appOf();
    const res = await request(app)
      .post('/v1/ticket')
      .set('authorization', `Bearer ${token}`)
      .send({ title: 'Printer jam', body: '3F copier', organizationId });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      ok: true,
      data: { title: 'Printer jam', body: '3F copier', status: 'OPEN' },
    });
  });

  it('returns VALIDATION_FAILED for an empty title', async () => {
    const { app, token, organizationId } = await appOf();
    const res = await request(app)
      .post('/v1/ticket')
      .set('authorization', `Bearer ${token}`)
      .send({ title: '', body: '3F copier', organizationId });
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
  });

  it('returns FORBIDDEN when another user posts to the org', async () => {
    const { app, token, organizationId } = await appOf();
    const other = await request(app).post('/v1/auth/register').send({
      email: 'outsider@ysk.hk',
      password: 'password1',
      displayName: 'Outsider',
    });
    expect(other.status).toBe(201);
    const res = await request(app)
      .post('/v1/ticket')
      .set('authorization', `Bearer ${other.body.data.accessToken}`)
      .send({ title: 'Printer jam', body: '3F copier', organizationId });
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
    const ownerList = await request(app)
      .get('/v1/ticket')
      .query({ organizationId })
      .set('authorization', `Bearer ${token}`);
    expect(ownerList.status).toBe(200);
    const outsiderList = await request(app)
      .get('/v1/ticket')
      .query({ organizationId })
      .set('authorization', `Bearer ${other.body.data.accessToken}`);
    expect(outsiderList.status).toBe(403);
  });

  it('returns UNAUTHENTICATED without a session', async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const res = await request(app)
      .post('/v1/ticket')
      .send({ title: 'Printer jam', body: '3F copier', organizationId: ORG });
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'UNAUTHENTICATED' } });
  });
});
