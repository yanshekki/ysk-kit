import type { ILlmUsageRepository } from '../domain/usage-repository';

export const createMemoryLlmUsageRepository = (): ILlmUsageRepository & {
  rows: Array<{ userId: string; model: string; createdAt: Date }>;
} => {
  const rows: Array<{ userId: string; model: string; createdAt: Date }> = [];
  return {
    rows,
    async create(input) {
      rows.push({ userId: input.userId, model: input.model, createdAt: new Date() });
    },
    async countSince(userId, since) {
      return rows.filter((row) => row.userId === userId && row.createdAt >= since).length;
    },
  };
};
