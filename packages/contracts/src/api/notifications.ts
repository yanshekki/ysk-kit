import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { PaginatedNotificationsSchema } from '../dto/notification.js';
import { PageQuerySchema } from '../dto/user.js';
import { ErrSchema, OkSchema } from '../errors/envelope.js';

const c = initContract();

export const notificationsContract = c.router({
  list: {
    method: 'GET',
    path: '/v1/notifications',
    query: PageQuerySchema,
    responses: { 200: OkSchema(PaginatedNotificationsSchema), 401: ErrSchema },
    summary: 'List my notifications',
  },
  markRead: {
    method: 'POST',
    path: '/v1/notifications/:id/read',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({}).optional(),
    responses: {
      200: OkSchema(z.object({ read: z.literal(true) })),
      401: ErrSchema,
      404: ErrSchema,
    },
    summary: 'Mark a notification as read',
  },
});
