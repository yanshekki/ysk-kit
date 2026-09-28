import { Platform } from '@ysk/contracts';
import type { TokenStore } from '@ysk/sdk';
export const createSecureTokenStore = (): TokenStore => ({
  async get() { return null; },
  async set() {},
  async clear() {},
});
export const mobilePlatform = Platform.IOS;
