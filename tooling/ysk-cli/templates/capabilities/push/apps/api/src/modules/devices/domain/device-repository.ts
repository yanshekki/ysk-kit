import type { DevicePlatform } from '@ysk-kit/contracts';

export type DeviceRecord = {
  id: string;
  userId: string;
  platform: DevicePlatform;
  tokenHash: string;
  token: string;
  createdAt: Date;
};

export interface IDeviceRepository {
  upsert(input: {
    userId: string;
    platform: DevicePlatform;
    tokenHash: string;
    token: string;
  }): Promise<DeviceRecord>;
  listForUser(userId: string): Promise<DeviceRecord[]>;
  deleteOwn(id: string, userId: string): Promise<boolean>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
}
