import type { Platform } from '@ysk/contracts';
import type { PrismaClient } from '../../../generated/prisma/client';
import type { ISessionRepository, SessionRecord } from '../domain/session-repository';

const toRecord = (row: {
  id: string;
  userId: string;
  refreshHash: string;
  platform: string;
  expiresAt: Date;
  revokedAt: Date | null;
}): SessionRecord => ({
  ...row,
  platform: row.platform as Platform,
});

export const createPrismaSessionRepository = (prisma: PrismaClient): ISessionRepository => ({
  async create(input) {
    const row = await prisma.session.create({ data: input });
    return toRecord(row);
  },
  async findByRefreshHash(hash) {
    const row = await prisma.session.findFirst({ where: { refreshHash: hash } });
    return row ? toRecord(row) : null;
  },
  async revoke(id, at) {
    await prisma.session.update({ where: { id }, data: { revokedAt: at } });
  },
  async revokeAllForUser(userId, at) {
    await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: at },
    });
  },
});
