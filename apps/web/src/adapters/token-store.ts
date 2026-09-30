import { createWebStorageTokenStore, type TokenStore } from '@ysk-kit/sdk';

export const createLocalTokenStore = (): TokenStore =>
  createWebStorageTokenStore({ access: 'ysk.access', refresh: 'ysk.refresh' });
