import { createHash } from 'node:crypto';
import type { DeviceDto, RegisterDeviceCommand } from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { IDeviceRepository } from '../domain/device-repository';

export const hashDeviceToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

const toDto = (row: {
  id: string;
  platform: DeviceDto['platform'];
  token: string;
  createdAt: Date;
}): DeviceDto => ({
  id: row.id,
  platform: row.platform,
  tokenSuffix: row.token.slice(-8),
  createdAt: row.createdAt.toISOString(),
});

export const createDeviceService = (devices: IDeviceRepository) => ({
  list: async (userId: string): Promise<DeviceDto[]> => {
    const rows = await devices.listForUser(userId);
    return rows.map(toDto);
  },
  register: async (userId: string, body: RegisterDeviceCommand): Promise<DeviceDto> => {
    const row = await devices.upsert({
      userId,
      platform: body.platform,
      tokenHash: hashDeviceToken(body.token),
      token: body.token,
    });
    return toDto(row);
  },
  remove: async (id: string, userId: string) => {
    const ok = await devices.deleteOwn(id, userId);
    if (!ok) throw new AppError('NOT_FOUND');
    return { removed: true as const };
  },
});

export type DeviceService = ReturnType<typeof createDeviceService>;
