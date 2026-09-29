import { z } from 'zod';

export const DevicePlatformSchema = z.enum(['ios', 'android']);
export type DevicePlatform = z.infer<typeof DevicePlatformSchema>;

export const RegisterDeviceCommandSchema = z.object({
  token: z.string().min(8).max(4096),
  platform: DevicePlatformSchema,
});
export type RegisterDeviceCommand = z.infer<typeof RegisterDeviceCommandSchema>;

export const DeviceDtoSchema = z.object({
  id: z.string().uuid(),
  platform: DevicePlatformSchema,
  tokenSuffix: z.string().min(1).max(8),
  createdAt: z.iso.datetime(),
});
export type DeviceDto = z.infer<typeof DeviceDtoSchema>;
