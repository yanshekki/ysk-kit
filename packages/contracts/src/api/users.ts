import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  CreateUserCommandSchema,
  PageQuerySchema,
  PaginatedUsersSchema,
  UserDtoSchema,
} from '../dto/user.js';
import { ErrSchema, OkSchema } from '../errors/envelope.js';

const c = initContract();

export const usersContract = c.router({
  list: {
    method: 'GET',
    path: '/v1/users',
    query: PageQuerySchema,
    responses: {
      200: OkSchema(PaginatedUsersSchema),
    },
    summary: 'List users',
  },
  create: {
    method: 'POST',
    path: '/v1/users',
    body: CreateUserCommandSchema,
    responses: {
      201: OkSchema(UserDtoSchema),
      409: ErrSchema,
      422: ErrSchema,
    },
    summary: 'Create user',
  },
  suspend: {
    method: 'POST',
    path: '/v1/users/:id/suspend',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({}).optional(),
    responses: {
      200: OkSchema(UserDtoSchema),
      401: ErrSchema,
      403: ErrSchema,
      404: ErrSchema,
    },
    summary: 'Suspend a user',
  },
});
