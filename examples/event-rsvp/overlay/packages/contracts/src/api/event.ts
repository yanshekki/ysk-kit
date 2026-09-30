import { initContract } from '@ts-rest/core';
import { CreateEventCommandSchema, EventDtoSchema, PaginatedEventSchema } from '../dto/event';
import { PageQuerySchema } from '../dto/user';
import { ErrSchema, OkSchema } from '../errors/envelope';

const c = initContract();

export const eventContract = c.router({
  list: {
    method: 'GET',
    path: '/v1/event',
    query: PageQuerySchema,
    responses: { 200: OkSchema(PaginatedEventSchema), 401: ErrSchema },
    summary: 'List my events',
  },
  create: {
    method: 'POST',
    path: '/v1/event',
    body: CreateEventCommandSchema,
    responses: {
      201: OkSchema(EventDtoSchema),
      401: ErrSchema,
      422: ErrSchema,
    },
    summary: 'Create an event',
  },
});
