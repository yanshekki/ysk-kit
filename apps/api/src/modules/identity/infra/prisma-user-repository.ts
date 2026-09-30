import { slicePage } from '@ysk-kit/application';
import { AppError } from '@ysk-kit/domain-kernel';
import { Prisma, type PrismaClient } from '../../../generated/prisma/client';
import { prismaIdCursor } from '../../../infra/prisma-page';
import type { IUserRepository } from '../domain/user-repository';
import { toUserDto, toUserRecord } from './user-mapper';

export const createPrismaUserRepository = (prisma: PrismaClient): IUserRepository => ({
  async findById(id) {
    const row = await prisma.user.findUnique({ where: { id } });
    return row ? toUserRecord(row) : null;
  },
  async findByEmail(email) {
    const row = await prisma.user.findUnique({ where: { email } });
    return row ? toUserRecord(row) : null;
  },
  async findByPhone(phone) {
    const row = await prisma.user.findUnique({ where: { phone } });
    return row ? toUserRecord(row) : null;
  },
  async list(query) {
    const rows = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: query.limit + 1,
      ...prismaIdCursor(query.cursor),
    });
    const page = slicePage(rows.map(toUserRecord), query.limit);
    return { items: page.items.map(toUserDto), nextCursor: page.nextCursor };
  },
  async create(input) {
    try {
      const row = await prisma.user.create({
        data: {
          email: input.email ?? null,
          phone: input.phone ?? null,
          displayName: input.displayName,
          role: input.role,
          status: input.status ?? 'ACTIVE',
          passwordHash: input.passwordHash ?? null,
        },
      });
      return toUserRecord(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('CONFLICT', 'Account already exists');
      }
      throw error;
    }
  },
  async save(user) {
    const row = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.email,
        phone: user.phone,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
        passwordHash: user.passwordHash,
      },
    });
    return toUserRecord(row);
  },
});
