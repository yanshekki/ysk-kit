import type { PrismaClient } from '../../../generated/prisma/client';
import type { IPasswordResetRepository } from '../domain/password-reset-repository';

export const createPrismaPasswordResetRepository = (
  prisma: PrismaClient,
): IPasswordResetRepository => ({
  async create(input) {
    return prisma.passwordReset.create({ data: input });
  },
  async findOpenByHash(hash) {
    return prisma.passwordReset.findFirst({ where: { tokenHash: hash, usedAt: null } });
  },
  async markUsed(id, at) {
    await prisma.passwordReset.update({ where: { id }, data: { usedAt: at } });
  },
});
