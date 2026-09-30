import type { AppError } from '@ysk-kit/domain-kernel';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../../app';
import { createMemoryInput } from '../../../create-memory-input';
import { createStockMoveService } from '../../stock-move/application/stock-move-service';
import { createMemoryStockMoveRepository } from '../../stock-move/infra/memory-stock-move-repository';
import { createSkuService } from '../application/sku-service';
import { createMemorySkuRepository } from './memory-sku-repository';

const AUTHOR = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';
const valid = {
  code: 'WIDGET-2',
  name: 'Box',
  qtyOnHand: 10,
};

describe('sku service', () => {
  it('creates a sku and lists it for the author only', async () => {
    const service = createSkuService(createMemorySkuRepository());
    const created = await service.create(AUTHOR, valid);
    expect(created.code).toBe('WIDGET-2');
    expect(created.name).toBe('Box');
    expect(created.qtyOnHand).toBe(10);
    expect((await service.list(AUTHOR, { limit: 20 })).items).toHaveLength(1);
    expect((await service.list(OTHER, { limit: 20 })).items).toHaveLength(0);
  });

  it('rejects a duplicate code for the same author', async () => {
    const service = createSkuService(createMemorySkuRepository());
    await service.create(AUTHOR, valid);
    await expect(service.create(AUTHOR, { ...valid, name: 'Other' })).rejects.toMatchObject({
      code: 'CONFLICT',
    } satisfies Partial<AppError>);
    await expect(service.create(OTHER, valid)).resolves.toMatchObject({ code: 'WIDGET-2' });
  });
});

describe('stock-move service', () => {
  it('applies IN, OUT, and ADJUST on an owned sku', async () => {
    const skus = createMemorySkuRepository();
    const skuService = createSkuService(skus);
    const sku = await skuService.create(AUTHOR, valid);
    const service = createStockMoveService(createMemoryStockMoveRepository(skus));
    await service.create(AUTHOR, { skuId: sku.id, delta: 3, reason: 'IN' });
    expect((await skuService.list(AUTHOR, { limit: 20 })).items[0]?.qtyOnHand).toBe(13);
    const out = await service.create(AUTHOR, { skuId: sku.id, delta: 2, reason: 'OUT' });
    expect(out.reason).toBe('OUT');
    expect((await skuService.list(AUTHOR, { limit: 20 })).items[0]?.qtyOnHand).toBe(11);
    await service.create(AUTHOR, { skuId: sku.id, delta: 4, reason: 'ADJUST' });
    expect((await skuService.list(AUTHOR, { limit: 20 })).items[0]?.qtyOnHand).toBe(4);
  });

  it('rejects an OUT that would go negative and leaves qty unchanged', async () => {
    const skus = createMemorySkuRepository();
    const skuService = createSkuService(skus);
    const sku = await skuService.create(AUTHOR, valid);
    const service = createStockMoveService(createMemoryStockMoveRepository(skus));
    await expect(
      service.create(AUTHOR, { skuId: sku.id, delta: 11, reason: 'OUT' }),
    ).rejects.toMatchObject({ code: 'CONFLICT' } satisfies Partial<AppError>);
    expect((await skuService.list(AUTHOR, { limit: 20 })).items[0]?.qtyOnHand).toBe(10);
  });

  it('rejects a missing or foreign sku', async () => {
    const skus = createMemorySkuRepository();
    const sku = await createSkuService(skus).create(AUTHOR, valid);
    const service = createStockMoveService(createMemoryStockMoveRepository(skus));
    await expect(
      service.create(AUTHOR, {
        skuId: '33333333-3333-4333-a333-333333333333',
        delta: 1,
        reason: 'IN',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' } satisfies Partial<AppError>);
    await expect(
      service.create(OTHER, { skuId: sku.id, delta: 1, reason: 'OUT' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' } satisfies Partial<AppError>);
  });
});

describe('sku HTTP', () => {
  const tokenOf = async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const registered = await request(app).post('/v1/auth/register').send({
      email: 'stock@ysk.hk',
      password: 'password1',
      displayName: 'Stock',
    });
    expect(registered.status).toBe(201);
    return { app, token: registered.body.data.accessToken as string };
  };

  it('returns the success envelope', async () => {
    const { app, token } = await tokenOf();
    const res = await request(app)
      .post('/v1/sku')
      .set('authorization', `Bearer ${token}`)
      .send(valid);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      ok: true,
      data: { code: 'WIDGET-2', name: 'Box', qtyOnHand: 10 },
    });
  });

  it('returns VALIDATION_FAILED for a negative quantity', async () => {
    const { app, token } = await tokenOf();
    const res = await request(app)
      .post('/v1/sku')
      .set('authorization', `Bearer ${token}`)
      .send({ ...valid, qtyOnHand: -1 });
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
  });

  it('returns CONFLICT for a duplicate code', async () => {
    const { app, token } = await tokenOf();
    await request(app).post('/v1/sku').set('authorization', `Bearer ${token}`).send(valid);
    const res = await request(app)
      .post('/v1/sku')
      .set('authorization', `Bearer ${token}`)
      .send(valid);
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'CONFLICT' } });
  });

  it('returns UNAUTHENTICATED without a session', async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const res = await request(app).post('/v1/sku').send(valid);
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'UNAUTHENTICATED' } });
  });

  it('creates a stock move and rejects a negative OUT', async () => {
    const { app, token } = await tokenOf();
    const created = await request(app)
      .post('/v1/sku')
      .set('authorization', `Bearer ${token}`)
      .send(valid);
    const ok = await request(app)
      .post('/v1/stock-move')
      .set('authorization', `Bearer ${token}`)
      .send({ skuId: created.body.data.id, delta: 2, reason: 'OUT' });
    expect(ok.status).toBe(201);
    const listed = await request(app).get('/v1/sku').set('authorization', `Bearer ${token}`);
    expect(listed.body.data.items[0]?.qtyOnHand).toBe(8);
    const negative = await request(app)
      .post('/v1/stock-move')
      .set('authorization', `Bearer ${token}`)
      .send({ skuId: created.body.data.id, delta: 20, reason: 'OUT' });
    expect(negative.status).toBe(409);
    expect(negative.body).toMatchObject({ ok: false, error: { code: 'CONFLICT' } });
    const after = await request(app).get('/v1/sku').set('authorization', `Bearer ${token}`);
    expect(after.body.data.items[0]?.qtyOnHand).toBe(8);
    const missing = await request(app)
      .post('/v1/stock-move')
      .set('authorization', `Bearer ${token}`)
      .send({
        skuId: '33333333-3333-4333-a333-333333333333',
        delta: 1,
        reason: 'IN',
      });
    expect(missing.status).toBe(404);
    expect(missing.body).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
  });
});
