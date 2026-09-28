import type { Platform } from '@ysk/contracts';
import { HttpClient } from './http';
import { memoryTokenStore, type TokenStore } from './token-store';
import { usersResource } from './resources/users';

export function createYskClient(opts: {
  baseUrl: string;
  platform: Platform;
  tokenStore?: TokenStore;
  fetchImpl?: typeof fetch;
}) {
  const http = new HttpClient({
    baseUrl: opts.baseUrl.replace(/\/$/, ''),
    platform: opts.platform,
    tokenStore: opts.tokenStore ?? memoryTokenStore(),
    fetchImpl: opts.fetchImpl,
  });
  return { users: usersResource(http) };
}

export type YskClient = ReturnType<typeof createYskClient>;
export { memoryTokenStore };
export type { TokenStore } from './token-store';
