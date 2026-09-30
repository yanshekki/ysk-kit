import { initContract } from '@ts-rest/core';
import {
  CreateMemberProfileCommandSchema,
  MemberProfileDtoSchema,
  PaginatedMemberProfileSchema,
} from '../dto/member-profile';
import { PageQuerySchema } from '../dto/user';
import { ErrSchema, OkSchema } from '../errors/envelope';

const c = initContract();

export const memberProfileContract = c.router({
  list: {
    method: 'GET',
    path: '/v1/member-profile',
    query: PageQuerySchema,
    responses: { 200: OkSchema(PaginatedMemberProfileSchema), 401: ErrSchema },
    summary: 'List my member profiles',
  },
  create: {
    method: 'POST',
    path: '/v1/member-profile',
    body: CreateMemberProfileCommandSchema,
    responses: {
      201: OkSchema(MemberProfileDtoSchema),
      401: ErrSchema,
      403: ErrSchema,
      409: ErrSchema,
      422: ErrSchema,
    },
    summary: 'Create a member profile',
  },
});
