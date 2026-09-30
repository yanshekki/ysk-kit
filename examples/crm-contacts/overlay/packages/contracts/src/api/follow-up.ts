import { initContract } from '@ts-rest/core';
import {
  CreateFollowUpCommandSchema,
  FollowUpDtoSchema,
  PaginatedFollowUpSchema,
} from '../dto/follow-up';
import { PageQuerySchema } from '../dto/user';
import { ErrSchema, OkSchema } from '../errors/envelope';

const c = initContract();

export const followUpContract = c.router({
  list: {
    method: 'GET',
    path: '/v1/follow-up',
    query: PageQuerySchema,
    responses: { 200: OkSchema(PaginatedFollowUpSchema), 401: ErrSchema },
    summary: 'List my follow-ups',
  },
  create: {
    method: 'POST',
    path: '/v1/follow-up',
    body: CreateFollowUpCommandSchema,
    responses: {
      201: OkSchema(FollowUpDtoSchema),
      401: ErrSchema,
      404: ErrSchema,
      422: ErrSchema,
    },
    summary: 'Create a follow-up',
  },
});
