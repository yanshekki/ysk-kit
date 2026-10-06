import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { CreateJobCommandSchema, JobDtoSchema, PaginatedJobSchema } from '../dto/job.js';
import { PageQuerySchema } from '../dto/user.js';
import { ErrSchema, OkSchema } from '../errors/envelope.js';

const c = initContract();

export const jobContract = c.router({
  list: {
    method: 'GET',
    path: '/v1/job',
    query: PageQuerySchema,
    responses: { 200: OkSchema(PaginatedJobSchema), 401: ErrSchema },
    summary: 'List my jobs',
  },
  create: {
    method: 'POST',
    path: '/v1/job',
    body: CreateJobCommandSchema,
    responses: {
      201: OkSchema(JobDtoSchema),
      401: ErrSchema,
      422: ErrSchema,
    },
    summary: 'Create a job (unpublished)',
  },
  publish: {
    method: 'POST',
    path: '/v1/job/:id/publish',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({}).optional(),
    responses: {
      200: OkSchema(JobDtoSchema),
      401: ErrSchema,
      404: ErrSchema,
      409: ErrSchema,
    },
    summary: 'Publish my unpublished job',
  },
});
