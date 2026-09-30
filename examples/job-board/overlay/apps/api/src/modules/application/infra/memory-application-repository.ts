import { slicePage } from '@ysk/application';
import type { ApplicationDto } from '@ysk/contracts';
import type {
  ApplicationJobRef,
  ApplicationRecord,
  IApplicationRepository,
} from '../domain/application-repository';

const toDto = (row: ApplicationRecord): ApplicationDto => ({
  id: row.id,
  jobId: row.jobId,
  applicantName: row.applicantName,
  email: row.email,
  cover: row.cover,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export type JobLookup = {
  getById: (id: string) => Promise<ApplicationJobRef | null>;
};

export const createMemoryApplicationRepository = (jobs?: JobLookup): IApplicationRepository => {
  const rows: ApplicationRecord[] = [];
  return {
    async create(authorId, input) {
      const now = new Date();
      const row: ApplicationRecord = {
        id: crypto.randomUUID(),
        jobId: input.jobId,
        applicantName: input.applicantName,
        email: input.email,
        cover: input.cover,
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
    async getJob(id) {
      if (!jobs) return null;
      const row = await jobs.getById(id);
      if (!row) return null;
      return { id: row.id, authorId: row.authorId, published: row.published };
    },
    async findByJobEmail(jobId, email) {
      return rows.find((row) => row.jobId === jobId && row.email === email) ?? null;
    },
  };
};
