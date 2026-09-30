import { slicePage } from '@ysk-kit/application';
import type { CourseDto } from '@ysk-kit/contracts';
import type { CourseRecord, ICourseRepository } from '../domain/course-repository';

const toDto = (row: CourseRecord): CourseDto => ({
  id: row.id,
  title: row.title,
  quota: row.quota,
  startsOn: row.startsOn,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const createMemoryCourseRepository = (): ICourseRepository => {
  const rows: CourseRecord[] = [];
  return {
    async create(authorId, input) {
      const now = new Date();
      const row: CourseRecord = {
        id: crypto.randomUUID(),
        title: input.title,
        quota: input.quota,
        startsOn: input.startsOn,
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
  };
};
