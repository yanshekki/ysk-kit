import { z } from 'zod';
import { PaginatedSchema } from './user.js';

export const RsvpDtoSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  attendeeName: z.string().min(1).max(80),
  email: z.string().email(),
  authorId: z.string().uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type RsvpDto = z.infer<typeof RsvpDtoSchema>;

export const PaginatedRsvpSchema = PaginatedSchema(RsvpDtoSchema);
export type PaginatedRsvp = z.infer<typeof PaginatedRsvpSchema>;

export const CreateRsvpCommandSchema = z.object({
  eventId: z.string().uuid(),
  attendeeName: z.string().min(1).max(80),
  email: z.string().email(),
});
export type CreateRsvpCommand = z.infer<typeof CreateRsvpCommandSchema>;
