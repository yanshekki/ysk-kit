import { describe, expect, it } from 'vitest';
import { createDesktopTokenStore } from './token-store';

describe('createDesktopTokenStore', () => {
  it('round-trips access and refresh then clears', async () => {
    let access: string | null = null;
    let refresh: string | null = null;
    const store = createDesktopTokenStore({
      get: async () => access,
      set: async (token) => {
        access = token;
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
    });
    await store.setPair?.('a', 'r');
    expect(await store.get()).toBe('a');
    expect(await store.getRefresh?.()).toBe('r');
    await store.clear();
    expect(await store.get()).toBeNull();
    expect(await store.getRefresh?.()).toBeNull();
  });
});
