import { initContract } from '@ts-rest/core';
import { CreateSkuCommandSchema, PaginatedSkuSchema, SkuDtoSchema } from '../dto/sku.js';
import { PageQuerySchema } from '../dto/user.js';
import { ErrSchema, OkSchema } from '../errors/envelope.js';

const c = initContract();

export const skuContract = c.router({
  list: {
    method: 'GET',
    path: '/v1/sku',
    query: PageQuerySchema,
    responses: { 200: OkSchema(PaginatedSkuSchema), 401: ErrSchema },
    summary: 'List my skus',
  },
  create: {
    method: 'POST',
    path: '/v1/sku',
    body: CreateSkuCommandSchema,
    responses: {
      201: OkSchema(SkuDtoSchema),
      401: ErrSchema,
      409: ErrSchema,
      422: ErrSchema,
    },
    summary: 'Create a sku',
  },
});
