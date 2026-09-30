import { createWebStorageTokenStore, type TokenStore } from '@ysk/sdk';

export const createLocalTokenStore = (): TokenStore =>
  createWebStorageTokenStore({ access: 'ysk.access', refresh: 'ysk.refresh' });
