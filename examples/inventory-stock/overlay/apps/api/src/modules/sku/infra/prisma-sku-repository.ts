import { slicePage } from '@ysk/application';
import type { SkuDto } from '@ysk/contracts';
import type { PrismaClient } from '../../../generated/prisma/client';
import type { ISkuRepository } from '../domain/sku-repository';

const toDto = (row: {
  id: string;
  code: string;
  name: string;
  qtyOnHand: number;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}): SkuDto => ({
  id: row.id,
  code: row.code,
  name: row.name,
  qtyOnHand: row.qtyOnHand,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const createPrismaSkuRepository = (prisma: PrismaClient): ISkuRepository => ({
  async create(authorId, input) {
    const row = await prisma.sku.create({
      data: {
        code: input.code,
        name: input.name,
        qtyOnHand: input.qtyOnHand,
        authorId,
      },
    });
    return toDto(row);
  },
  async listForAuthor(authorId, query) {
    const rows = await prisma.sku.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const page = slicePage(rows, query.limit);
    return { items: page.items.map(toDto), nextCursor: page.nextCursor };
  },
  async getById(id) {
    return prisma.sku.findUnique({ where: { id } });
  },
  async findByAuthorCode(authorId, code) {
    return prisma.sku.findFirst({ where: { authorId, code } });
  },
});
