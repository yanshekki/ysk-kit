import { PrismaClient } from '@prisma/client';
import { AppError } from '@ysk/domain-kernel';
import type { IUserRepository } from '../domain/user-repository';
import { toUserDto } from './user-mapper';

export const createPrismaUserRepository = (prisma: PrismaClient): IUserRepository => ({
  async list() {
    const rows = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    return rows.map(toUserDto);
  },
  async create(input) {
    try {
      const row = await prisma.user.create({ data: input });
      return toUserDto(row);
    } catch {
      throw new AppError('CONFLICT', 'Email already exists', 409);
    }
  },
});
