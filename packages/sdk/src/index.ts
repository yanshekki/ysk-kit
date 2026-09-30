import type { Platform } from '@ysk-kit/contracts';
import { HttpClient } from './http';
import { connectRealtime } from './realtime';
import { apiKeysResource } from './resources/api-keys';
import { auditResource } from './resources/audit';
import { authResource } from './resources/auth';
import { billingResource } from './resources/billing';
import { devicesResource } from './resources/devices';
import { llmResource } from './resources/llm';
import { notificationsResource } from './resources/notifications';
import { organizationsResource } from './resources/organizations';
import { usersResource } from './resources/users';
import { createWebStorageTokenStore, memoryTokenStore, type TokenStore } from './token-store';

export function createYskClient(opts: {
  baseUrl: string;
  platform: Platform;
  tokenStore?: TokenStore;
  fetchImpl?: typeof fetch;
}) {
  const tokenStore = opts.tokenStore ?? memoryTokenStore();
  const baseUrl = opts.baseUrl.replace(/\/$/, '');
  const http = new HttpClient({
    baseUrl,
    platform: opts.platform,
    tokenStore,
    ...(opts.fetchImpl ? { fetchImpl: opts.fetchImpl } : {}),
  });
  return {
    auth: authResource(http, tokenStore),
    apiKeys: apiKeysResource(http),
    audit: auditResource(http),
    billing: billingResource(http),
    users: usersResource(http),
    notifications: notificationsResource(http),
    devices: devicesResource(http),
    organizations: organizationsResource(http),
    llm: llmResource(http, {
      baseUrl,
      platform: opts.platform,
      tokenStore,
      ...(opts.fetchImpl ? { fetchImpl: opts.fetchImpl } : {}),
    }),
    connectRealtime: () => connectRealtime({ baseUrl, platform: opts.platform, tokenStore }),
  };
}

export type YskClient = ReturnType<typeof createYskClient>;
export type { DevicePort } from './ports/device';
export type { FilePickerPort } from './ports/file-picker';
export type { TokenStore } from './token-store';
export { connectRealtime, createWebStorageTokenStore, memoryTokenStore };
