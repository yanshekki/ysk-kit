export interface TokenStore {
  get(): Promise<string | null>;
  set(token: string): Promise<void>;
  clear(): Promise<void>;
  getRefresh?(): Promise<string | null>;
  setPair?(access: string, refresh: string): Promise<void>;
}

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
