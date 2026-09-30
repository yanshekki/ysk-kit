import type { AppError } from '@ysk-kit/domain-kernel';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../../app';
import { createMemoryInput } from '../../../create-memory-input';
import { createMemberProfileService } from '../application/member-profile-service';
import { createMemoryMemberProfileRepository } from './memory-member-profile-repository';

const AUTHOR = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';
const ORG = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const valid = { displayName: 'Harbour Member', organizationId: ORG };

describe('member-profile service', () => {
  it('creates a profile and lists it for the author', async () => {
    const repo = createMemoryMemberProfileRepository();
    repo.seedMembership(AUTHOR, ORG, 'OWNER');
    const service = createMemberProfileService(repo);
    const created = await service.create(AUTHOR, valid);
    expect(created.displayName).toBe('Harbour Member');
    expect((await service.list(AUTHOR, { limit: 20 })).items).toHaveLength(1);
    expect((await service.list(OTHER, { limit: 20 })).items).toHaveLength(0);
  });

  it('rejects a non-member', async () => {
    const service = createMemberProfileService(createMemoryMemberProfileRepository());
    await expect(service.create(AUTHOR, valid)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    } satisfies Partial<AppError>);
  });

  it('rejects a duplicate profile for the same author and org', async () => {
    const repo = createMemoryMemberProfileRepository();
    repo.seedMembership(AUTHOR, ORG, 'MEMBER');
    const service = createMemberProfileService(repo);
    await service.create(AUTHOR, valid);
    await expect(service.create(AUTHOR, { ...valid, displayName: 'Other' })).rejects.toMatchObject({
      code: 'CONFLICT',
    } satisfies Partial<AppError>);
  });
});

describe('member-profile HTTP', () => {
  const appOf = async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const registered = await request(app).post('/v1/auth/register').send({
      email: 'club@ysk.hk',
      password: 'password1',
      displayName: 'Club',
    });
    expect(registered.status).toBe(201);
    const token = registered.body.data.accessToken as string;
    const org = await request(app)
      .post('/v1/organizations')
      .set('authorization', `Bearer ${token}`)
      .send({ name: 'Harbour Club' });
    expect(org.status).toBe(201);
    return { app, token, organizationId: org.body.data.id as string };
  };

  it('returns the success envelope after creating an org', async () => {
    const { app, token, organizationId } = await appOf();
    const res = await request(app)
      .post('/v1/member-profile')
      .set('authorization', `Bearer ${token}`)
      .send({ displayName: 'Harbour Member', organizationId });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      ok: true,
      data: { displayName: 'Harbour Member' },
    });
  });

  it('returns VALIDATION_FAILED for an empty displayName', async () => {
    const { app, token, organizationId } = await appOf();
    const res = await request(app)
      .post('/v1/member-profile')
      .set('authorization', `Bearer ${token}`)
      .send({ displayName: '', organizationId });
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
  });

  it('returns CONFLICT for a second profile in the same org', async () => {
    const { app, token, organizationId } = await appOf();
    const first = await request(app)
      .post('/v1/member-profile')
      .set('authorization', `Bearer ${token}`)
      .send({ displayName: 'Harbour Member', organizationId });
    expect(first.status).toBe(201);
    const res = await request(app)
      .post('/v1/member-profile')
      .set('authorization', `Bearer ${token}`)
      .send({ displayName: 'Harbour Member', organizationId });
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'CONFLICT' } });
  });

  it('returns FORBIDDEN when another user posts to the org', async () => {
    const { app, organizationId } = await appOf();
    const other = await request(app).post('/v1/auth/register').send({
      email: 'outsider@ysk.hk',
      password: 'password1',
      displayName: 'Outsider',
    });
    expect(other.status).toBe(201);
    const res = await request(app)
      .post('/v1/member-profile')
      .set('authorization', `Bearer ${other.body.data.accessToken}`)
      .send({ displayName: 'Harbour Member', organizationId });
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
  });

  it('returns UNAUTHENTICATED without a session', async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const res = await request(app)
      .post('/v1/member-profile')
      .send({ displayName: 'Harbour Member', organizationId: ORG });
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'UNAUTHENTICATED' } });
  });
});
