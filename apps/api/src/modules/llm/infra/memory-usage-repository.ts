import type { ILlmUsageRepository } from '../domain/usage-repository';

export const createMemoryLlmUsageRepository = (): ILlmUsageRepository & {
  rows: Array<{ userId: string; model: string }>;
} => {
  const rows: Array<{ userId: string; model: string }> = [];
  return {
    rows,
    async create(input) {
      rows.push({ userId: input.userId, model: input.model });
    },
  };
};
