import { z } from 'zod';
import { NotificationTypeSchema } from '../enums/notification-type.js';
import { PaginatedSchema } from './user.js';

export const NotificationDtoSchema = z.object({
  id: z.string().uuid(),
  type: NotificationTypeSchema,
  title: z.string(),
  body: z.string(),
  readAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});
export type NotificationDto = z.infer<typeof NotificationDtoSchema>;

export const PaginatedNotificationsSchema = PaginatedSchema(NotificationDtoSchema);
export type PaginatedNotifications = z.infer<typeof PaginatedNotificationsSchema>;
