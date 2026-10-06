import { z } from 'zod';
import { PaginatedSchema } from './user.js';

export const QuoteStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
} as const;

export type QuoteStatus = (typeof QuoteStatus)[keyof typeof QuoteStatus];
export const QUOTE_STATUS_VALUES = Object.values(QuoteStatus) as [QuoteStatus, ...QuoteStatus[]];
export const QuoteStatusSchema = z.enum(QUOTE_STATUS_VALUES);

export const QuoteDtoSchema = z.object({
  id: z.string().uuid(),
  clientName: z.string().min(1).max(80),
  amountHkd: z.number().int().positive(),
  status: QuoteStatusSchema,
  authorId: z.string().uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type QuoteDto = z.infer<typeof QuoteDtoSchema>;

export const PaginatedQuoteSchema = PaginatedSchema(QuoteDtoSchema);
export type PaginatedQuote = z.infer<typeof PaginatedQuoteSchema>;

export const CreateQuoteCommandSchema = z.object({
  clientName: z.string().min(1).max(80),
  amountHkd: z.number().int().positive(),
});
export type CreateQuoteCommand = z.infer<typeof CreateQuoteCommandSchema>;
