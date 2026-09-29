import type { DeviceRecord, IDeviceRepository } from '../domain/device-repository';

export const createMemoryDeviceRepository = (): IDeviceRepository => {
  const rows: DeviceRecord[] = [];
  return {
    async upsert(input) {
      const existing = rows.find(
        (row) => row.userId === input.userId && row.tokenHash === input.tokenHash,
      );
      if (existing) {
        existing.token = input.token;
        existing.platform = input.platform;
        return existing;
      }
      const row: DeviceRecord = { id: crypto.randomUUID(), createdAt: new Date(), ...input };
      rows.push(row);
      return row;
    },
    async listForUser(userId) {
      return rows.filter((row) => row.userId === userId);
    },
    async deleteOwn(id, userId) {
      const index = rows.findIndex((row) => row.id === id && row.userId === userId);
      if (index < 0) return false;
      rows.splice(index, 1);
      return true;
    },
    async deleteByTokenHash(tokenHash) {
      const index = rows.findIndex((row) => row.tokenHash === tokenHash);
      if (index >= 0) rows.splice(index, 1);
    },
  };
};
