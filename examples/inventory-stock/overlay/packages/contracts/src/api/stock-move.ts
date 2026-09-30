import { initContract } from '@ts-rest/core';
import {
  CreateStockMoveCommandSchema,
  PaginatedStockMoveSchema,
  StockMoveDtoSchema,
} from '../dto/stock-move';
import { PageQuerySchema } from '../dto/user';
import { ErrSchema, OkSchema } from '../errors/envelope';

const c = initContract();

export const stockMoveContract = c.router({
  list: {
    method: 'GET',
    path: '/v1/stock-move',
    query: PageQuerySchema,
    responses: { 200: OkSchema(PaginatedStockMoveSchema), 401: ErrSchema },
    summary: 'List my stock moves',
  },
  create: {
    method: 'POST',
    path: '/v1/stock-move',
    body: CreateStockMoveCommandSchema,
    responses: {
      201: OkSchema(StockMoveDtoSchema),
      401: ErrSchema,
      404: ErrSchema,
      409: ErrSchema,
      422: ErrSchema,
    },
    summary: 'Create a stock move',
  },
});
