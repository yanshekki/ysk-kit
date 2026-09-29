import { Platform } from '@ysk/contracts';
import type { TokenStore } from '@ysk/sdk';
import * as SecureStore from 'expo-secure-store';

const ACCESS = 'ysk.access';
const REFRESH = 'ysk.refresh';

export const createSecureTokenStore = (): TokenStore => ({
  get: () => SecureStore.getItemAsync(ACCESS),
  set: (token) => SecureStore.setItemAsync(ACCESS, token),
  getRefresh: () => SecureStore.getItemAsync(REFRESH),
  setPair: async (access, refresh) => {
    await SecureStore.setItemAsync(ACCESS, access);
    await SecureStore.setItemAsync(REFRESH, refresh);
  },
  clear: async () => {
    await SecureStore.deleteItemAsync(ACCESS);
    await SecureStore.deleteItemAsync(REFRESH);
  },
});

export const mobilePlatform = Platform.IOS;
