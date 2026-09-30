import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  CreateTicketCommandSchema,
  PaginatedTicketSchema,
  TicketDtoSchema,
  TicketListQuerySchema,
  UpdateTicketStatusCommandSchema,
} from '../dto/ticket';
import { ErrSchema, OkSchema } from '../errors/envelope';

const c = initContract();

export const ticketContract = c.router({
  list: {
    method: 'GET',
    path: '/v1/ticket',
    query: TicketListQuerySchema,
    responses: {
      200: OkSchema(PaginatedTicketSchema),
      401: ErrSchema,
      403: ErrSchema,
      422: ErrSchema,
    },
    summary: 'List tickets in an organization',
  },
  create: {
    method: 'POST',
    path: '/v1/ticket',
    body: CreateTicketCommandSchema,
    responses: {
      201: OkSchema(TicketDtoSchema),
      401: ErrSchema,
      403: ErrSchema,
      422: ErrSchema,
    },
    summary: 'Open a ticket',
  },
  status: {
    method: 'POST',
    path: '/v1/ticket/:id/status',
    pathParams: z.object({ id: z.string().uuid() }),
    body: UpdateTicketStatusCommandSchema,
    responses: {
      200: OkSchema(TicketDtoSchema),
      401: ErrSchema,
      403: ErrSchema,
      404: ErrSchema,
      422: ErrSchema,
    },
    summary: 'Change ticket status',
  },
});
