import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();

vi.mock('expo-secure-store', () => ({
  getItemAsync: async (key: string) => store.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => {
    store.set(key, value);
  },
  deleteItemAsync: async (key: string) => {
    store.delete(key);
  },
}));

describe('createSecureTokenStore', () => {
  beforeEach(() => {
    store.clear();
  });

  it('writes and reads a token', async () => {
    const { createSecureTokenStore } = await import('./token-store');
    const tokens = createSecureTokenStore();
    await tokens.set('abc');
    await expect(tokens.get()).resolves.toBe('abc');
    await tokens.clear();
    await expect(tokens.get()).resolves.toBeNull();
  });
});
