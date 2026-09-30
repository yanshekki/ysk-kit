import { z } from 'zod';
import { PaginatedSchema } from './user';

export const EventDtoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(80),
  venue: z.string().min(1).max(80),
  startsAt: z.iso.datetime(),
  capacity: z.number().int().positive(),
  authorId: z.string().uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type EventDto = z.infer<typeof EventDtoSchema>;

export const PaginatedEventSchema = PaginatedSchema(EventDtoSchema);
export type PaginatedEvent = z.infer<typeof PaginatedEventSchema>;

export const CreateEventCommandSchema = z.object({
  title: z.string().min(1).max(80),
  venue: z.string().min(1).max(80),
  startsAt: z.iso.datetime(),
  capacity: z.number().int().positive(),
});
export type CreateEventCommand = z.infer<typeof CreateEventCommandSchema>;
