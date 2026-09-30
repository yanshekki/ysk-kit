import { QueryClient } from '@tanstack/react-query';
import { defaultPublicConfig } from '@ysk-kit/config';
import { createYskClient } from '@ysk-kit/sdk';
import { createUserHooks } from '@ysk-kit/web-sdk';
import { createLocalTokenStore } from '../adapters/token-store';

export const queryClient = new QueryClient();

export const api = createYskClient({
  baseUrl: process.env.API_PUBLIC_URL ?? defaultPublicConfig().apiPublicUrl,
  platform: 'web',
  tokenStore: createLocalTokenStore(),
});

export const userHooks = createUserHooks(api);
