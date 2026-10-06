import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  AppointmentDtoSchema,
  CreateAppointmentCommandSchema,
  PaginatedAppointmentSchema,
} from '../dto/appointment.js';
import { PageQuerySchema } from '../dto/user.js';
import { ErrSchema, OkSchema } from '../errors/envelope.js';

const c = initContract();

export const appointmentContract = c.router({
  list: {
    method: 'GET',
    path: '/v1/appointment',
    query: PageQuerySchema,
    responses: { 200: OkSchema(PaginatedAppointmentSchema), 401: ErrSchema },
    summary: 'List my appointments',
  },
  create: {
    method: 'POST',
    path: '/v1/appointment',
    body: CreateAppointmentCommandSchema,
    responses: {
      201: OkSchema(AppointmentDtoSchema),
      401: ErrSchema,
      409: ErrSchema,
      422: ErrSchema,
    },
    summary: 'Book an appointment',
  },
  cancel: {
    method: 'POST',
    path: '/v1/appointment/:id/cancel',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({}).optional(),
    responses: {
      200: OkSchema(AppointmentDtoSchema),
      401: ErrSchema,
      404: ErrSchema,
      409: ErrSchema,
    },
    summary: 'Cancel my scheduled appointment',
  },
  complete: {
    method: 'POST',
    path: '/v1/appointment/:id/complete',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({}).optional(),
    responses: {
      200: OkSchema(AppointmentDtoSchema),
      401: ErrSchema,
      404: ErrSchema,
      409: ErrSchema,
    },
    summary: 'Mark my scheduled appointment as done',
  },
});
