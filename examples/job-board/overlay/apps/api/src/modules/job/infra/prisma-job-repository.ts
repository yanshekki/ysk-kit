import { slicePage } from '@ysk/application';
import type { JobDto } from '@ysk/contracts';
import type { PrismaClient } from '../../../generated/prisma/client';
import type { IJobRepository } from '../domain/job-repository';

const toDto = (row: {
  id: string;
  title: string;
  department: string;
  published: boolean;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}): JobDto => ({
  id: row.id,
  title: row.title,
  department: row.department,
  published: row.published,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const createPrismaJobRepository = (prisma: PrismaClient): IJobRepository => ({
  async create(authorId, input) {
    const row = await prisma.job.create({
      data: {
        title: input.title,
        department: input.department,
        published: false,
        authorId,
      },
    });
    return toDto(row);
  },
  async listForAuthor(authorId, query) {
    const rows = await prisma.job.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const page = slicePage(rows, query.limit);
    return { items: page.items.map(toDto), nextCursor: page.nextCursor };
  },
  async getById(id) {
    return prisma.job.findUnique({ where: { id } });
  },
  async updatePublished(id, published) {
    const row = await prisma.job.update({ where: { id }, data: { published } });
    return toDto(row);
  },
});
