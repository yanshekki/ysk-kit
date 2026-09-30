export interface TokenStore {
  get(): Promise<string | null>;
  set(token: string): Promise<void>;
  clear(): Promise<void>;
  getRefresh?(): Promise<string | null>;
  setPair?(access: string, refresh: string): Promise<void>;
}

export const createWebStorageTokenStore = (keys: {
  access: string;
  refresh: string;
}): TokenStore => ({
  get: async () => globalThis.localStorage.getItem(keys.access),
  set: async (token) => {
    globalThis.localStorage.setItem(keys.access, token);
  },
  getRefresh: async () => globalThis.localStorage.getItem(keys.refresh),
  setPair: async (access, refresh) => {
    globalThis.localStorage.setItem(keys.access, access);
    globalThis.localStorage.setItem(keys.refresh, refresh);
  },
  clear: async () => {
    globalThis.localStorage.removeItem(keys.access);
    globalThis.localStorage.removeItem(keys.refresh);
  },
});

export const memoryTokenStore = (): TokenStore => {
  let access: string | null = null;
  let refresh: string | null = null;
  return {
    get: async () => access,
    set: async (value) => {
      access = value;
    },
    getRefresh: async () => refresh,
    setPair: async (nextAccess, nextRefresh) => {
      access = nextAccess;
      refresh = nextRefresh;
    },
    clear: async () => {
      access = null;
      refresh = null;
    },
  };
};
