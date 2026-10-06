import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { PageQuerySchema } from '../dto/user.js';
import {
  CreateWorkOrderCommandSchema,
  PaginatedWorkOrderSchema,
  WorkOrderDtoSchema,
} from '../dto/work-order.js';
import { ErrSchema, OkSchema } from '../errors/envelope.js';

const c = initContract();

export const workOrderContract = c.router({
  list: {
    method: 'GET',
    path: '/v1/work-order',
    query: PageQuerySchema,
    responses: { 200: OkSchema(PaginatedWorkOrderSchema), 401: ErrSchema },
    summary: 'List my work orders',
  },
  create: {
    method: 'POST',
    path: '/v1/work-order',
    body: CreateWorkOrderCommandSchema,
    responses: {
      201: OkSchema(WorkOrderDtoSchema),
      401: ErrSchema,
      422: ErrSchema,
    },
    summary: 'Create a work order',
  },
  assign: {
    method: 'POST',
    path: '/v1/work-order/:id/assign',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({}).optional(),
    responses: {
      200: OkSchema(WorkOrderDtoSchema),
      401: ErrSchema,
      404: ErrSchema,
      409: ErrSchema,
    },
    summary: 'Assign a NEW work order',
  },
  complete: {
    method: 'POST',
    path: '/v1/work-order/:id/complete',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({}).optional(),
    responses: {
      200: OkSchema(WorkOrderDtoSchema),
      401: ErrSchema,
      404: ErrSchema,
      409: ErrSchema,
    },
    summary: 'Complete an ASSIGNED work order',
  },
});
