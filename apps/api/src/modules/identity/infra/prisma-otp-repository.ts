import type { PrismaClient } from '../../../generated/prisma/client';
import type { IOtpRepository } from '../domain/otp-repository';

export const createPrismaOtpRepository = (prisma: PrismaClient): IOtpRepository => ({
  async create(input) {
    return prisma.otpChallenge.create({ data: input });
  },
  async findLatestOpen(phone) {
    return prisma.otpChallenge.findFirst({
      where: { phone, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  },
  async incrementAttempts(id) {
    return prisma.otpChallenge.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  },
  async consume(id, at) {
    await prisma.otpChallenge.update({ where: { id }, data: { consumedAt: at } });
  },
  async countSince(phone, since) {
    return prisma.otpChallenge.count({ where: { phone, createdAt: { gte: since } } });
  },
});
