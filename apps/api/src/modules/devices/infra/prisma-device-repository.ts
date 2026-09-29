import type { PrismaClient } from '@prisma/client';
import type { DevicePlatform } from '@ysk/contracts';
import type { DeviceRecord, IDeviceRepository } from '../domain/device-repository';

const toRecord = (row: {
  id: string;
  userId: string;
  platform: string;
  tokenHash: string;
  token: string;
  createdAt: Date;
}): DeviceRecord => ({
  ...row,
  platform: row.platform as DevicePlatform,
});

export const createPrismaDeviceRepository = (prisma: PrismaClient): IDeviceRepository => ({
  async upsert(input) {
    const row = await prisma.device.upsert({
      where: { userId_tokenHash: { userId: input.userId, tokenHash: input.tokenHash } },
      create: input,
      update: { token: input.token, platform: input.platform },
    });
    return toRecord(row);
  },
  async listForUser(userId) {
    const rows = await prisma.device.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toRecord);
  },
  async deleteOwn(id, userId) {
    const row = await prisma.device.findFirst({ where: { id, userId } });
    if (!row) return false;
    await prisma.device.delete({ where: { id } });
    return true;
  },
  async deleteByTokenHash(tokenHash) {
    await prisma.device.deleteMany({ where: { tokenHash } });
  },
});
