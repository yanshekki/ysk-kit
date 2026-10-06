import type { PrismaClient } from '../../../generated/prisma/client';
import type { ILlmUsageRepository } from '../domain/usage-repository';

export const createPrismaLlmUsageRepository = (prisma: PrismaClient): ILlmUsageRepository => ({
  async create(input) {
    await prisma.llmUsage.create({
      data: {
        userId: input.userId,
        model: input.model,
        promptTokens: input.usage.promptTokens,
        completionTokens: input.usage.completionTokens,
        totalTokens: input.usage.totalTokens,
        ...(input.requestId ? { requestId: input.requestId } : {}),
      },
    });
  },
  async countSince(userId, since) {
    return prisma.llmUsage.count({
      where: { userId, createdAt: { gte: since } },
    });
  },
});
