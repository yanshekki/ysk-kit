import type { Platform } from '@ysk-kit/contracts';
import { HttpClient } from './http.js';
import { connectRealtime } from './realtime.js';
import { apiKeysResource } from './resources/api-keys.js';
import { auditResource } from './resources/audit.js';
import { authResource } from './resources/auth.js';
import { billingResource } from './resources/billing.js';
import { devicesResource } from './resources/devices.js';
import { llmResource } from './resources/llm.js';
import { notificationsResource } from './resources/notifications.js';
import { organizationsResource } from './resources/organizations.js';
import { usersResource } from './resources/users.js';
import { createWebStorageTokenStore, memoryTokenStore, type TokenStore } from './token-store.js';

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
export type { DevicePort } from './ports/device.js';
export type { FilePickerPort } from './ports/file-picker.js';
export type { TokenStore } from './token-store.js';
export { connectRealtime, createWebStorageTokenStore, memoryTokenStore };
