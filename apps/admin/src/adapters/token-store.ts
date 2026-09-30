import { createWebStorageTokenStore, type TokenStore } from '@ysk/sdk';

export const createLocalTokenStore = (): TokenStore =>
  createWebStorageTokenStore({ access: 'ysk.admin.access', refresh: 'ysk.admin.refresh' });
