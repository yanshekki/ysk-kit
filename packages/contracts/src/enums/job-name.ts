import { z } from 'zod';
import { MailTemplateSchema } from './mail-template.js';
import { NotificationTypeSchema } from './notification-type.js';

export const JobName = {
  EMAIL_SEND: 'email.send',
  NOTIFICATION_CREATE: 'notification.create',
  PUSH_SEND: 'push.send',
} as const;

export type JobName = (typeof JobName)[keyof typeof JobName];
export const JOB_NAME_VALUES = Object.values(JobName) as [JobName, ...JobName[]];
export const JobNameSchema = z.enum(JOB_NAME_VALUES);

export const EmailSendPayloadSchema = z.object({
  to: z.string().email(),
  template: MailTemplateSchema,
  locale: z.enum(['zh-HK', 'en']),
  vars: z.record(z.string(), z.string()),
});
export type EmailSendPayload = z.infer<typeof EmailSendPayloadSchema>;

export const NotificationCreatePayloadSchema = z.object({
  userId: z.string().uuid(),
  type: NotificationTypeSchema,
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(500),
});
export type NotificationCreatePayload = z.infer<typeof NotificationCreatePayloadSchema>;

export const PushSendPayloadSchema = z.object({
  token: z.string().min(8),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(500),
  data: z.record(z.string(), z.string()).optional(),
});
export type PushSendPayload = z.infer<typeof PushSendPayloadSchema>;

export const JobPayloadSchema = {
  'email.send': EmailSendPayloadSchema,
  'notification.create': NotificationCreatePayloadSchema,
  'push.send': PushSendPayloadSchema,
} as const;

export type JobPayload = {
  'email.send': EmailSendPayload;
  'notification.create': NotificationCreatePayload;
  'push.send': PushSendPayload;
};
