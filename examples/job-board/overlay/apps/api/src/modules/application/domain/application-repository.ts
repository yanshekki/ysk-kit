import type {
  ApplicationDto,
  CreateApplicationCommand,
  PageQuery,
  PaginatedApplication,
} from '@ysk-kit/contracts';

export type ApplicationRecord = {
  id: string;
  jobId: string;
  applicantName: string;
  email: string;
  cover: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ApplicationJobRef = { id: string; authorId: string; published: boolean };

export interface IApplicationRepository {
  create(authorId: string, input: CreateApplicationCommand): Promise<ApplicationDto>;
  listForAuthor(authorId: string, query: PageQuery): Promise<PaginatedApplication>;
  getJob(id: string): Promise<ApplicationJobRef | null>;
  findByJobEmail(jobId: string, email: string): Promise<ApplicationRecord | null>;
}
