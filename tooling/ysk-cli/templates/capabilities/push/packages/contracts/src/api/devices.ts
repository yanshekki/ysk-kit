import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { DeviceDtoSchema, RegisterDeviceCommandSchema } from '../dto/device';
import { ErrSchema, OkSchema } from '../errors/envelope';

const c = initContract();

export const devicesContract = c.router({
  list: {
    method: 'GET',
    path: '/v1/me/devices',
    responses: { 200: OkSchema(z.array(DeviceDtoSchema)), 401: ErrSchema },
    summary: 'List my devices',
  },
  register: {
    method: 'PUT',
    path: '/v1/me/devices',
    body: RegisterDeviceCommandSchema,
    responses: { 200: OkSchema(DeviceDtoSchema), 401: ErrSchema, 422: ErrSchema },
    summary: 'Register or refresh a push token',
  },
  remove: {
    method: 'DELETE',
    path: '/v1/me/devices/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: OkSchema(z.object({ removed: z.literal(true) })),
      401: ErrSchema,
      404: ErrSchema,
    },
    summary: 'Remove a device',
  },
});
