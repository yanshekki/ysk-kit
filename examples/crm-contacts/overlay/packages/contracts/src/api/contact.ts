import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  ContactDtoSchema,
  CreateContactCommandSchema,
  PaginatedContactSchema,
  UpdateContactStatusCommandSchema,
} from '../dto/contact';
import { PageQuerySchema } from '../dto/user';
import { ErrSchema, OkSchema } from '../errors/envelope';

const c = initContract();

export const contactContract = c.router({
  list: {
    method: 'GET',
    path: '/v1/contact',
    query: PageQuerySchema,
    responses: { 200: OkSchema(PaginatedContactSchema), 401: ErrSchema },
    summary: 'List my contacts',
  },
  create: {
    method: 'POST',
    path: '/v1/contact',
    body: CreateContactCommandSchema,
    responses: {
      201: OkSchema(ContactDtoSchema),
      401: ErrSchema,
      409: ErrSchema,
      422: ErrSchema,
    },
    summary: 'Create a contact',
  },
  status: {
    method: 'POST',
    path: '/v1/contact/:id/status',
    pathParams: z.object({ id: z.string().uuid() }),
    body: UpdateContactStatusCommandSchema,
    responses: {
      200: OkSchema(ContactDtoSchema),
      401: ErrSchema,
      404: ErrSchema,
    },
    summary: 'Change contact status',
  },
});
