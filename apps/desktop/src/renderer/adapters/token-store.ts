import type { TokenStore } from '@ysk/sdk';

export type DesktopTokenBridge = {
  get(): Promise<string | null>;
  set(token: string): Promise<void>;
  getRefresh(): Promise<string | null>;
  setPair(access: string, refresh: string): Promise<void>;
  clear(): Promise<void>;
};

export const createDesktopTokenStore = (bridge: DesktopTokenBridge): TokenStore => ({
  get: () => bridge.get(),
  set: (token) => bridge.set(token),
  getRefresh: () => bridge.getRefresh(),
  setPair: (access, refresh) => bridge.setPair(access, refresh),
  clear: () => bridge.clear(),
});

export const createSafeStorageTokenStore = (): TokenStore => {
  const bridge = (globalThis as { window?: { yskDesktop?: { token: DesktopTokenBridge } } }).window
    ?.yskDesktop?.token;
  if (!bridge) throw new Error('yskDesktop preload missing');
  return createDesktopTokenStore(bridge);
};
