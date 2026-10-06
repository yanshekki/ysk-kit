import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createWebStorageTokenStore, memoryTokenStore } from './token-store.js';

const memory = new Map<string, string>();

beforeEach(() => {
  memory.clear();
  globalThis.localStorage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
    removeItem: (key: string) => {
      memory.delete(key);
    },
    clear: () => memory.clear(),
    key: () => null,
    get length() {
      return memory.size;
    },
  };
});

describe('token stores', () => {
  afterEach(() => {
    memory.clear();
  });

  it('memory store round-trips access and refresh', async () => {
    const store = memoryTokenStore();
    await store.set('a1');
    expect(await store.get()).toBe('a1');
    await store.setPair?.('a2', 'r2');
    expect(await store.get()).toBe('a2');
    expect(await store.getRefresh?.()).toBe('r2');
    await store.clear();
    expect(await store.get()).toBeNull();
    expect(await store.getRefresh?.()).toBeNull();
  });

  it('web storage store uses the given keys', async () => {
    const store = createWebStorageTokenStore({ access: 'a', refresh: 'r' });
    await store.setPair?.('tok', 'ref');
    expect(globalThis.localStorage.getItem('a')).toBe('tok');
    expect(globalThis.localStorage.getItem('r')).toBe('ref');
    expect(await store.get()).toBe('tok');
    await store.clear();
    expect(globalThis.localStorage.getItem('a')).toBeNull();
  });
});
