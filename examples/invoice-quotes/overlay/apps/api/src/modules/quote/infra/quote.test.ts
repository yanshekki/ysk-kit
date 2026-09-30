import type { AppError } from '@ysk-kit/domain-kernel';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../../app';
import { createMemoryInput } from '../../../create-memory-input';
import { createQuoteService } from '../application/quote-service';
import { createMemoryQuoteRepository } from './memory-quote-repository';

const AUTHOR = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';
const valid = { clientName: 'YSK Limited', amountHkd: 128000 };

describe('quote service', () => {
  it('creates a DRAFT and lists it for the author only', async () => {
    const service = createQuoteService(createMemoryQuoteRepository());
    const created = await service.create(AUTHOR, valid);
    expect(created.status).toBe('DRAFT');
    expect(created.amountHkd).toBe(128000);
    expect((await service.list(AUTHOR, { limit: 20 })).items).toHaveLength(1);
    expect((await service.list(OTHER, { limit: 20 })).items).toHaveLength(0);
  });

  it('sends DRAFT to SENT and accepts SENT', async () => {
    const service = createQuoteService(createMemoryQuoteRepository());
    const created = await service.create(AUTHOR, valid);
    const sent = await service.send(AUTHOR, created.id);
    expect(sent.status).toBe('SENT');
    const accepted = await service.accept(AUTHOR, created.id);
    expect(accepted.status).toBe('ACCEPTED');
  });

  it('rejects send unless DRAFT and accept unless SENT', async () => {
    const service = createQuoteService(createMemoryQuoteRepository());
    const created = await service.create(AUTHOR, valid);
    await expect(service.accept(AUTHOR, created.id)).rejects.toMatchObject({
      code: 'CONFLICT',
    } satisfies Partial<AppError>);
    await service.send(AUTHOR, created.id);
    await expect(service.send(AUTHOR, created.id)).rejects.toMatchObject({
      code: 'CONFLICT',
    } satisfies Partial<AppError>);
    await expect(
      service.send(AUTHOR, '33333333-3333-4333-a333-333333333333'),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' } satisfies Partial<AppError>);
    await expect(service.send(OTHER, created.id)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    } satisfies Partial<AppError>);
  });
});

describe('quote HTTP', () => {
  const tokenOf = async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const registered = await request(app).post('/v1/auth/register').send({
      email: 'quote@ysk.hk',
      password: 'password1',
      displayName: 'Quote',
    });
    expect(registered.status).toBe(201);
    return { app, token: registered.body.data.accessToken as string };
  };

  it('returns the success envelope', async () => {
    const { app, token } = await tokenOf();
    const res = await request(app)
      .post('/v1/quote')
      .set('authorization', `Bearer ${token}`)
      .send(valid);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      ok: true,
      data: { clientName: 'YSK Limited', amountHkd: 128000, status: 'DRAFT' },
    });
  });

  it('returns VALIDATION_FAILED for amount 0', async () => {
    const { app, token } = await tokenOf();
    const res = await request(app)
      .post('/v1/quote')
      .set('authorization', `Bearer ${token}`)
      .send({ ...valid, amountHkd: 0 });
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
  });

  it('sends then accepts, and CONFLICT on the wrong status', async () => {
    const { app, token } = await tokenOf();
    const created = await request(app)
      .post('/v1/quote')
      .set('authorization', `Bearer ${token}`)
      .send(valid);
    expect(created.status).toBe(201);
    const id = created.body.data.id as string;
    const tooSoon = await request(app)
      .post(`/v1/quote/${id}/accept`)
      .set('authorization', `Bearer ${token}`)
      .send({});
    expect(tooSoon.status).toBe(409);
    expect(tooSoon.body).toMatchObject({ ok: false, error: { code: 'CONFLICT' } });
    const sent = await request(app)
      .post(`/v1/quote/${id}/send`)
      .set('authorization', `Bearer ${token}`)
      .send({});
    expect(sent.status).toBe(200);
    expect(sent.body.data.status).toBe('SENT');
    const again = await request(app)
      .post(`/v1/quote/${id}/send`)
      .set('authorization', `Bearer ${token}`)
      .send({});
    expect(again.status).toBe(409);
    const accepted = await request(app)
      .post(`/v1/quote/${id}/accept`)
      .set('authorization', `Bearer ${token}`)
      .send({});
    expect(accepted.status).toBe(200);
    expect(accepted.body.data.status).toBe('ACCEPTED');
  });

  it('returns UNAUTHENTICATED without a session', async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const res = await request(app).post('/v1/quote').send(valid);
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'UNAUTHENTICATED' } });
  });
});
