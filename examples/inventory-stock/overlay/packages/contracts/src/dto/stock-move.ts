import { z } from 'zod';
import { PaginatedSchema } from './user.js';

export const StockMoveReason = {
  IN: 'IN',
  OUT: 'OUT',
  ADJUST: 'ADJUST',
} as const;

export type StockMoveReason = (typeof StockMoveReason)[keyof typeof StockMoveReason];
export const STOCK_MOVE_REASON_VALUES = Object.values(StockMoveReason) as [
  StockMoveReason,
  ...StockMoveReason[],
];
export const StockMoveReasonSchema = z.enum(STOCK_MOVE_REASON_VALUES);

export const StockMoveDtoSchema = z.object({
  id: z.string().uuid(),
  skuId: z.string().uuid(),
  delta: z.number().int().positive(),
  reason: StockMoveReasonSchema,
  authorId: z.string().uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type StockMoveDto = z.infer<typeof StockMoveDtoSchema>;

export const PaginatedStockMoveSchema = PaginatedSchema(StockMoveDtoSchema);
export type PaginatedStockMove = z.infer<typeof PaginatedStockMoveSchema>;

export const CreateStockMoveCommandSchema = z.object({
  skuId: z.string().uuid(),
  delta: z.number().int().positive(),
  reason: StockMoveReasonSchema,
});
export type CreateStockMoveCommand = z.infer<typeof CreateStockMoveCommandSchema>;
