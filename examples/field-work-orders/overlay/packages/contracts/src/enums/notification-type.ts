import { z } from 'zod';

export const NotificationType = {
  AUTH_WELCOME: 'auth.welcome',
  AUTH_RESET: 'auth.reset',
  USER_CREATED: 'user.created',
  ORG_INVITED: 'org.invited',
  WORK_ASSIGNED: 'work.assigned',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
export const NOTIFICATION_TYPE_VALUES = Object.values(NotificationType) as [
  NotificationType,
  ...NotificationType[],
];
export const NotificationTypeSchema = z.enum(NOTIFICATION_TYPE_VALUES);
