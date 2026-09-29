import { z } from 'zod';

export const RealtimeEvent = {
  NOTIFICATION_CREATED: 'notification.created',
} as const;

export type RealtimeEvent = (typeof RealtimeEvent)[keyof typeof RealtimeEvent];
export const REALTIME_EVENT_VALUES = Object.values(RealtimeEvent) as [
  RealtimeEvent,
  ...RealtimeEvent[],
];
export const RealtimeEventSchema = z.enum(REALTIME_EVENT_VALUES);
