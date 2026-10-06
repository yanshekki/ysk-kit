import { initContract } from '@ts-rest/core';
import { CreateRsvpCommandSchema, PaginatedRsvpSchema, RsvpDtoSchema } from '../dto/rsvp.js';
import { PageQuerySchema } from '../dto/user.js';
import { ErrSchema, OkSchema } from '../errors/envelope.js';

const c = initContract();

export const rsvpContract = c.router({
  list: {
    method: 'GET',
    path: '/v1/rsvp',
    query: PageQuerySchema,
    responses: { 200: OkSchema(PaginatedRsvpSchema), 401: ErrSchema },
    summary: 'List my RSVPs',
  },
  create: {
    method: 'POST',
    path: '/v1/rsvp',
    body: CreateRsvpCommandSchema,
    responses: {
      201: OkSchema(RsvpDtoSchema),
      401: ErrSchema,
      404: ErrSchema,
      409: ErrSchema,
      422: ErrSchema,
    },
    summary: 'RSVP to an event',
  },
});
