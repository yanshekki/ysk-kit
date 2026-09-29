import type { PrismaClient } from '@prisma/client';
import type { IFileRepository } from '../application/file-service';

export const createPrismaFileRepository = (prisma: PrismaClient): IFileRepository => ({
  async create(input) {
    return prisma.fileObject.create({ data: input });
  },
});
