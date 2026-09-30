import { z } from 'zod';
import { PageQuerySchema, PaginatedSchema } from './user';

export const TicketStatus = {
  OPEN: 'OPEN',
  PENDING: 'PENDING',
  RESOLVED: 'RESOLVED',
} as const;

export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];
export const TICKET_STATUS_VALUES = Object.values(TicketStatus) as [
  TicketStatus,
  ...TicketStatus[],
];
export const TicketStatusSchema = z.enum(TICKET_STATUS_VALUES);

export const TicketDtoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  body: z.string().max(8000),
  organizationId: z.string().uuid(),
  status: TicketStatusSchema,
  authorId: z.string().uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type TicketDto = z.infer<typeof TicketDtoSchema>;

export const PaginatedTicketSchema = PaginatedSchema(TicketDtoSchema);
export type PaginatedTicket = z.infer<typeof PaginatedTicketSchema>;

export const TicketListQuerySchema = PageQuerySchema.extend({
  organizationId: z.string().uuid(),
});
export type TicketListQuery = z.infer<typeof TicketListQuerySchema>;

export const CreateTicketCommandSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(8000).default(''),
  organizationId: z.string().uuid(),
});
export type CreateTicketCommand = z.infer<typeof CreateTicketCommandSchema>;

export const UpdateTicketStatusCommandSchema = z.object({
  status: TicketStatusSchema,
});
export type UpdateTicketStatusCommand = z.infer<typeof UpdateTicketStatusCommandSchema>;
