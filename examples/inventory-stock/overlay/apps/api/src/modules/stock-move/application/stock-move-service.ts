import type { CreateStockMoveCommand, PageQuery, StockMoveReason } from '@ysk/contracts';
import { AppError } from '@ysk/domain-kernel';
import type { IStockMoveRepository } from '../domain/stock-move-repository';

export const nextQtyOnHand = (
  qtyOnHand: number,
  reason: StockMoveReason,
  delta: number,
): number => {
  if (reason === 'IN') return qtyOnHand + delta;
  if (reason === 'OUT') return qtyOnHand - delta;
  return delta;
};

export const createStockMoveService = (repo: IStockMoveRepository) => ({
  list: (authorId: string, query: PageQuery) => repo.listForAuthor(authorId, query),
  create: async (authorId: string, input: CreateStockMoveCommand) => {
    const sku = await repo.getSku(input.skuId);
    if (!sku || sku.authorId !== authorId) throw new AppError('NOT_FOUND');
    const next = nextQtyOnHand(sku.qtyOnHand, input.reason, input.delta);
    if (next < 0) throw new AppError('CONFLICT', 'Quantity on hand cannot be negative');
    await repo.applyQty(sku.id, next);
    return repo.create(authorId, input);
  },
});

export type StockMoveService = ReturnType<typeof createStockMoveService>;
