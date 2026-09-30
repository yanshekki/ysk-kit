import { slicePage } from '@ysk-kit/application';
import type { StockMoveDto, StockMoveReason } from '@ysk-kit/contracts';
import type { PrismaClient } from '../../../generated/prisma/client';
import type { IStockMoveRepository } from '../domain/stock-move-repository';

const toDto = (row: {
  id: string;
  skuId: string;
  delta: number;
  reason: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}): StockMoveDto => ({
  id: row.id,
  skuId: row.skuId,
  delta: row.delta,
  reason: row.reason as StockMoveReason,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const createPrismaStockMoveRepository = (prisma: PrismaClient): IStockMoveRepository => ({
  async create(authorId, input) {
    const row = await prisma.stockMove.create({
      data: {
        skuId: input.skuId,
        delta: input.delta,
        reason: input.reason,
        authorId,
      },
    });
    return toDto(row);
  },
  async listForAuthor(authorId, query) {
    const rows = await prisma.stockMove.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const page = slicePage(rows, query.limit);
    return { items: page.items.map(toDto), nextCursor: page.nextCursor };
  },
  async getSku(id) {
    const row = await prisma.sku.findUnique({ where: { id } });
    if (!row) return null;
    return { id: row.id, authorId: row.authorId, qtyOnHand: row.qtyOnHand };
  },
  async applyQty(id, nextQty) {
    await prisma.sku.update({ where: { id }, data: { qtyOnHand: nextQty } });
  },
});
