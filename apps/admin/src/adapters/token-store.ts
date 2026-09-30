import { createWebStorageTokenStore, type TokenStore } from '@ysk-kit/sdk';

export const createLocalTokenStore = (): TokenStore =>
  createWebStorageTokenStore({ access: 'ysk.admin.access', refresh: 'ysk.admin.refresh' });
