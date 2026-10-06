import { initContract } from '@ts-rest/core';
import {
  CreateEnrollmentCommandSchema,
  EnrollmentDtoSchema,
  PaginatedEnrollmentSchema,
} from '../dto/enrollment.js';
import { PageQuerySchema } from '../dto/user.js';
import { ErrSchema, OkSchema } from '../errors/envelope.js';

const c = initContract();

export const enrollmentContract = c.router({
  list: {
    method: 'GET',
    path: '/v1/enrollment',
    query: PageQuerySchema,
    responses: { 200: OkSchema(PaginatedEnrollmentSchema), 401: ErrSchema },
    summary: 'List my enrolments',
  },
  create: {
    method: 'POST',
    path: '/v1/enrollment',
    body: CreateEnrollmentCommandSchema,
    responses: {
      201: OkSchema(EnrollmentDtoSchema),
      401: ErrSchema,
      404: ErrSchema,
      409: ErrSchema,
      422: ErrSchema,
    },
    summary: 'Enrol a student on a course',
  },
});
