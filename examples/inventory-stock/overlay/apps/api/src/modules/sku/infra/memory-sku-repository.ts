import { slicePage } from '@ysk/application';
import type { SkuDto } from '@ysk/contracts';
import type { ISkuRepository, SkuRecord } from '../domain/sku-repository';

const toDto = (row: SkuRecord): SkuDto => ({
  id: row.id,
  code: row.code,
  name: row.name,
  qtyOnHand: row.qtyOnHand,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const createMemorySkuRepository = (): ISkuRepository => {
  const rows: SkuRecord[] = [];
  return {
    async create(authorId, input) {
      const now = new Date();
      const row: SkuRecord = {
        id: crypto.randomUUID(),
        code: input.code,
        name: input.name,
        qtyOnHand: input.qtyOnHand,
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
    async getById(id) {
      return rows.find((row) => row.id === id) ?? null;
    },
    async findByAuthorCode(authorId, code) {
      return rows.find((row) => row.authorId === authorId && row.code === code) ?? null;
    },
  };
};
