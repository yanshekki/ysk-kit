import { initContract } from '@ts-rest/core';
import {
  ApplicationDtoSchema,
  CreateApplicationCommandSchema,
  PaginatedApplicationSchema,
} from '../dto/application.js';
import { PageQuerySchema } from '../dto/user.js';
import { ErrSchema, OkSchema } from '../errors/envelope.js';

const c = initContract();

export const applicationContract = c.router({
  list: {
    method: 'GET',
    path: '/v1/application',
    query: PageQuerySchema,
    responses: { 200: OkSchema(PaginatedApplicationSchema), 401: ErrSchema },
    summary: 'List my applications',
  },
  create: {
    method: 'POST',
    path: '/v1/application',
    body: CreateApplicationCommandSchema,
    responses: {
      201: OkSchema(ApplicationDtoSchema),
      401: ErrSchema,
      404: ErrSchema,
      409: ErrSchema,
      422: ErrSchema,
    },
    summary: 'Apply to a published job',
  },
});
