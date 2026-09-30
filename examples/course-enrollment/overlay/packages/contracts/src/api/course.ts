import { initContract } from '@ts-rest/core';
import { CourseDtoSchema, CreateCourseCommandSchema, PaginatedCourseSchema } from '../dto/course';
import { PageQuerySchema } from '../dto/user';
import { ErrSchema, OkSchema } from '../errors/envelope';

const c = initContract();

export const courseContract = c.router({
  list: {
    method: 'GET',
    path: '/v1/course',
    query: PageQuerySchema,
    responses: { 200: OkSchema(PaginatedCourseSchema), 401: ErrSchema },
    summary: 'List my courses',
  },
  create: {
    method: 'POST',
    path: '/v1/course',
    body: CreateCourseCommandSchema,
    responses: {
      201: OkSchema(CourseDtoSchema),
      401: ErrSchema,
      422: ErrSchema,
    },
    summary: 'Create a course',
  },
});
