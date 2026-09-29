import { z } from 'zod';

export const Platform = {
  WEB: 'web',
  IOS: 'ios',
  ANDROID: 'android',
  ADMIN: 'admin',
  DESKTOP: 'desktop',
  API: 'api',
} as const;

export type Platform = (typeof Platform)[keyof typeof Platform];
export const PLATFORM_VALUES = Object.values(Platform) as [Platform, ...Platform[]];
export const PlatformSchema = z.enum(PLATFORM_VALUES);
