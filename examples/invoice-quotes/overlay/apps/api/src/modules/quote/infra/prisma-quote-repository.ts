import { slicePage } from '@ysk-kit/application';
import type { QuoteDto, QuoteStatus } from '@ysk-kit/contracts';
import type { PrismaClient } from '../../../generated/prisma/client';
import type { IQuoteRepository } from '../domain/quote-repository';

const toDto = (row: {
  id: string;
  clientName: string;
  amountHkd: number;
  status: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}): QuoteDto => ({
  id: row.id,
  clientName: row.clientName,
  amountHkd: row.amountHkd,
  status: row.status as QuoteStatus,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const createPrismaQuoteRepository = (prisma: PrismaClient): IQuoteRepository => ({
  async create(authorId, input) {
    const row = await prisma.quote.create({
      data: {
        clientName: input.clientName,
        amountHkd: input.amountHkd,
        status: 'DRAFT',
        authorId,
      },
    });
    return toDto(row);
  },
  async listForAuthor(authorId, query) {
    const rows = await prisma.quote.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const page = slicePage(rows, query.limit);
    return { items: page.items.map(toDto), nextCursor: page.nextCursor };
  },
  async getById(id) {
    const row = await prisma.quote.findUnique({ where: { id } });
    if (!row) return null;
    return {
      ...row,
      status: row.status as QuoteStatus,
    };
  },
  async updateStatus(id, status) {
    const row = await prisma.quote.update({
      where: { id },
      data: { status },
    });
    return toDto(row);
  },
});
