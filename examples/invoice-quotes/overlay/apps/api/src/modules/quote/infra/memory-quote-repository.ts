import { slicePage } from '@ysk-kit/application';
import type { QuoteDto, QuoteStatus } from '@ysk-kit/contracts';
import type { IQuoteRepository, QuoteRecord } from '../domain/quote-repository';

const toDto = (row: QuoteRecord): QuoteDto => ({
  id: row.id,
  clientName: row.clientName,
  amountHkd: row.amountHkd,
  status: row.status,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const createMemoryQuoteRepository = (): IQuoteRepository => {
  const rows: QuoteRecord[] = [];
  return {
    async create(authorId, input) {
      const now = new Date();
      const row: QuoteRecord = {
        id: crypto.randomUUID(),
        clientName: input.clientName,
        amountHkd: input.amountHkd,
        status: 'DRAFT',
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
    async updateStatus(id, status: QuoteStatus) {
      const row = rows.find((item) => item.id === id);
      if (!row) throw new Error(`quote ${id} missing`);
      row.status = status;
      row.updatedAt = new Date();
      return toDto(row);
    },
  };
};
