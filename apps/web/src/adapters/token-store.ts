import type { TokenStore } from '@ysk/sdk';

const ACCESS = 'ysk.access';
const REFRESH = 'ysk.refresh';

export const createLocalTokenStore = (): TokenStore => ({
  get: async () => localStorage.getItem(ACCESS),
  set: async (token) => {
    localStorage.setItem(ACCESS, token);
  },
  getRefresh: async () => localStorage.getItem(REFRESH),
  setPair: async (access, refresh) => {
    localStorage.setItem(ACCESS, access);
    localStorage.setItem(REFRESH, refresh);
  },
  clear: async () => {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  },
});
