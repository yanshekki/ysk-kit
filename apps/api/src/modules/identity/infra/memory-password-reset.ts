import type {
  IPasswordResetRepository,
  PasswordResetRecord,
} from '../domain/password-reset-repository';

export const createMemoryPasswordResetRepository = (): IPasswordResetRepository => {
  const rows: PasswordResetRecord[] = [];
  return {
    async create(input) {
      const row: PasswordResetRecord = { id: crypto.randomUUID(), usedAt: null, ...input };
      rows.push(row);
      return row;
    },
    async findOpenByHash(hash) {
      return rows.find((row) => row.tokenHash === hash && row.usedAt === null) ?? null;
    },
    async markUsed(id, at) {
      const row = rows.find((item) => item.id === id);
      if (row) row.usedAt = at;
    },
  };
};
