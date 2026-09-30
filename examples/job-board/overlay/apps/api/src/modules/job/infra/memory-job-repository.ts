import { slicePage } from '@ysk-kit/application';
import type { JobDto } from '@ysk-kit/contracts';
import type { IJobRepository, JobRecord } from '../domain/job-repository';

const toDto = (row: JobRecord): JobDto => ({
  id: row.id,
  title: row.title,
  department: row.department,
  published: row.published,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const createMemoryJobRepository = (): IJobRepository => {
  const rows: JobRecord[] = [];
  return {
    async create(authorId, input) {
      const now = new Date();
      const row: JobRecord = {
        id: crypto.randomUUID(),
        title: input.title,
        department: input.department,
        published: false,
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
    async updatePublished(id, published) {
      const row = rows.find((item) => item.id === id);
      if (!row) throw new Error(`job ${id} missing`);
      row.published = published;
      row.updatedAt = new Date();
      return toDto(row);
    },
  };
};
