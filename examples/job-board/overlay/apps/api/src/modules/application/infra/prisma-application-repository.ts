import { slicePage } from '@ysk/application';
import type { ApplicationDto } from '@ysk/contracts';
import type { PrismaClient } from '../../../generated/prisma/client';
import type { IApplicationRepository } from '../domain/application-repository';

const toDto = (row: {
  id: string;
  jobId: string;
  applicantName: string;
  email: string;
  cover: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}): ApplicationDto => ({
  id: row.id,
  jobId: row.jobId,
  applicantName: row.applicantName,
  email: row.email,
  cover: row.cover,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const createPrismaApplicationRepository = (
  prisma: PrismaClient,
): IApplicationRepository => ({
  async create(authorId, input) {
    const row = await prisma.application.create({
      data: {
        jobId: input.jobId,
        applicantName: input.applicantName,
        email: input.email,
        cover: input.cover,
        authorId,
      },
    });
    return toDto(row);
  },
  async listForAuthor(authorId, query) {
    const rows = await prisma.application.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const page = slicePage(rows, query.limit);
    return { items: page.items.map(toDto), nextCursor: page.nextCursor };
  },
  async getJob(id) {
    const row = await prisma.job.findUnique({ where: { id } });
    if (!row) return null;
    return { id: row.id, authorId: row.authorId, published: row.published };
  },
  async findByJobEmail(jobId, email) {
    return prisma.application.findFirst({ where: { jobId, email } });
  },
});
