import { slicePage } from '@ysk-kit/application';
import type { StockMoveDto, StockMoveReason } from '@ysk-kit/contracts';
import type {
  IStockMoveRepository,
  StockMoveRecord,
  StockMoveSkuRef,
} from '../domain/stock-move-repository';

const toDto = (row: StockMoveRecord): StockMoveDto => ({
  id: row.id,
  skuId: row.skuId,
  delta: row.delta,
  reason: row.reason as StockMoveReason,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export type SkuLookup = {
  getById: (id: string) => Promise<StockMoveSkuRef | null>;
};

export const createMemoryStockMoveRepository = (skuRepo?: SkuLookup): IStockMoveRepository => {
  const rows: StockMoveRecord[] = [];
  const local: StockMoveSkuRef[] = [];
  return {
    async create(authorId, input) {
      const now = new Date();
      const row: StockMoveRecord = {
        id: crypto.randomUUID(),
        skuId: input.skuId,
        delta: input.delta,
        reason: input.reason,
        authorId,
        createdAt: now,
        updatedAt: now,
      };
      rows.unshift(row);
      return toDto(row);
    },
    async listForAuthor(authorId, query) {
      const mine = rows.filter((row) => row.authorId === authorId);
      const page = slicePage(mine, query.limit);
      return { items: page.items.map(toDto), nextCursor: page.nextCursor };
    },
    async getSku(id) {
      if (skuRepo) return skuRepo.getById(id);
      return local.find((row) => row.id === id) ?? null;
    },
    async applyQty(id, nextQty) {
      const sku = skuRepo
        ? await skuRepo.getById(id)
        : (local.find((row) => row.id === id) ?? null);
      if (!sku) throw new Error(`sku ${id} missing`);
      sku.qtyOnHand = nextQty;
    },
  };
};
