import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { ErrSchema, OkSchema } from '../errors/envelope.js';

const c = initContract();

export const HealthDataSchema = z.object({ status: z.literal('ok') });
export const ReadyDataSchema = z.object({ status: z.literal('ready') });

export const healthContract = c.router({
  get: {
    method: 'GET',
    path: '/health',
    responses: {
      200: OkSchema(HealthDataSchema),
    },
    summary: 'Liveness',
  },
  ready: {
    method: 'GET',
    path: '/ready',
    responses: {
      200: OkSchema(ReadyDataSchema),
      503: ErrSchema,
    },
    summary: 'Readiness (database)',
  },
});
