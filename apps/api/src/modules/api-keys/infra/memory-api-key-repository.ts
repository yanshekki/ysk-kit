import type { ApiKeyRecord, IApiKeyRepository } from '../domain/api-key-repository';

export const createMemoryApiKeyRepository = (): IApiKeyRepository => {
  const rows: ApiKeyRecord[] = [];
  return {
    async create(input) {
      const row: ApiKeyRecord = {
        id: crypto.randomUUID(),
        lastUsedAt: null,
        revokedAt: null,
        createdAt: new Date(),
        ...input,
      };
      rows.unshift(row);
      return row;
    },
    async listForUser(userId) {
      return rows.filter((row) => row.userId === userId && !row.revokedAt);
    },
    async findByPrefix(prefix) {
      return rows.find((row) => row.prefix === prefix && !row.revokedAt) ?? null;
    },
    async findByIdForUser(id, userId) {
      return rows.find((row) => row.id === id && row.userId === userId) ?? null;
    },
    async markRevoked(id, at) {
      const row = rows.find((item) => item.id === id);
      if (row) row.revokedAt = at;
    },
    async touchLastUsed(id, at) {
      const row = rows.find((item) => item.id === id);
      if (row) row.lastUsedAt = at;
    },
  };
};
