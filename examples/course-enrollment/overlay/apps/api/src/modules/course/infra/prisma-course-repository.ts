import { slicePage } from '@ysk/application';
import type { CourseDto } from '@ysk/contracts';
import type { PrismaClient } from '../../../generated/prisma/client';
import type { ICourseRepository } from '../domain/course-repository';

const toDto = (row: {
  id: string;
  title: string;
  quota: number;
  startsOn: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}): CourseDto => ({
  id: row.id,
  title: row.title,
  quota: row.quota,
  startsOn: row.startsOn,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const createPrismaCourseRepository = (prisma: PrismaClient): ICourseRepository => ({
  async create(authorId, input) {
    const row = await prisma.course.create({
      data: {
        title: input.title,
        quota: input.quota,
        startsOn: input.startsOn,
        authorId,
      },
    });
    return toDto(row);
  },
  async listForAuthor(authorId, query) {
    const rows = await prisma.course.findMany({
      where: { authorId },
      orderBy: { startsOn: 'asc' },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const page = slicePage(rows, query.limit);
    return { items: page.items.map(toDto), nextCursor: page.nextCursor };
  },
  async getById(id) {
    return prisma.course.findUnique({ where: { id } });
  },
});
