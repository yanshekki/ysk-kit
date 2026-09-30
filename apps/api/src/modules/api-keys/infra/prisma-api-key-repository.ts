import type { Permission } from '@ysk-kit/contracts';
import type { Prisma, PrismaClient } from '../../../generated/prisma/client';
import type { ApiKeyRecord, IApiKeyRepository } from '../domain/api-key-repository';

const toRecord = (row: {
  id: string;
  userId: string;
  name: string;
  prefix: string;
  last4: string;
  tokenHash: string;
  permissions: Prisma.JsonValue;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}): ApiKeyRecord => ({
  id: row.id,
  userId: row.userId,
  name: row.name,
  prefix: row.prefix,
  last4: row.last4,
  tokenHash: row.tokenHash,
  permissions: Array.isArray(row.permissions) ? (row.permissions as Permission[]) : [],
  lastUsedAt: row.lastUsedAt,
  revokedAt: row.revokedAt,
  createdAt: row.createdAt,
});

export const createPrismaApiKeyRepository = (prisma: PrismaClient): IApiKeyRepository => ({
  async create(input) {
    const row = await prisma.apiKey.create({
      data: {
        userId: input.userId,
        name: input.name,
        prefix: input.prefix,
        last4: input.last4,
        tokenHash: input.tokenHash,
        permissions: input.permissions,
      },
    });
    return toRecord(row);
  },
  async listForUser(userId) {
    const rows = await prisma.apiKey.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toRecord);
  },
  async findByPrefix(prefix) {
    const row = await prisma.apiKey.findFirst({ where: { prefix, revokedAt: null } });
    return row ? toRecord(row) : null;
  },
  async findByIdForUser(id, userId) {
    const row = await prisma.apiKey.findFirst({ where: { id, userId } });
    return row ? toRecord(row) : null;
  },
  async markRevoked(id, at) {
    await prisma.apiKey.update({ where: { id }, data: { revokedAt: at } });
  },
  async touchLastUsed(id, at) {
    await prisma.apiKey.update({ where: { id }, data: { lastUsedAt: at } });
  },
});
