import type { CreateJobCommand, JobDto, PageQuery, PaginatedJob } from '@ysk/contracts';

export type JobRecord = {
  id: string;
  title: string;
  department: string;
  published: boolean;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface IJobRepository {
  create(authorId: string, input: CreateJobCommand): Promise<JobDto>;
  listForAuthor(authorId: string, query: PageQuery): Promise<PaginatedJob>;
  getById(id: string): Promise<JobRecord | null>;
  updatePublished(id: string, published: boolean): Promise<JobDto>;
}
