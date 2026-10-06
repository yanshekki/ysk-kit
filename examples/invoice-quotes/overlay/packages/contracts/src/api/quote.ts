import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { CreateQuoteCommandSchema, PaginatedQuoteSchema, QuoteDtoSchema } from '../dto/quote.js';
import { PageQuerySchema } from '../dto/user.js';
import { ErrSchema, OkSchema } from '../errors/envelope.js';

const c = initContract();

export const quoteContract = c.router({
  list: {
    method: 'GET',
    path: '/v1/quote',
    query: PageQuerySchema,
    responses: { 200: OkSchema(PaginatedQuoteSchema), 401: ErrSchema },
    summary: 'List my quotes',
  },
  create: {
    method: 'POST',
    path: '/v1/quote',
    body: CreateQuoteCommandSchema,
    responses: {
      201: OkSchema(QuoteDtoSchema),
      401: ErrSchema,
      422: ErrSchema,
    },
    summary: 'Create a draft quote',
  },
  send: {
    method: 'POST',
    path: '/v1/quote/:id/send',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({}).optional(),
    responses: {
      200: OkSchema(QuoteDtoSchema),
      401: ErrSchema,
      404: ErrSchema,
      409: ErrSchema,
    },
    summary: 'Send a draft quote',
  },
  accept: {
    method: 'POST',
    path: '/v1/quote/:id/accept',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({}).optional(),
    responses: {
      200: OkSchema(QuoteDtoSchema),
      401: ErrSchema,
      404: ErrSchema,
      409: ErrSchema,
    },
    summary: 'Accept a sent quote',
  },
});
