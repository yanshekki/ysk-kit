import { QueryClient } from '@tanstack/react-query';
import { defaultPublicConfig } from '@ysk-kit/config';
import { createYskClient } from '@ysk-kit/sdk';
import { createUserHooks } from '@ysk-kit/web-sdk';
import { createLocalTokenStore } from '../adapters/token-store';

export const queryClient = new QueryClient();

export const tokenStore = createLocalTokenStore();

export const api = createYskClient({
  baseUrl: defaultPublicConfig().apiPublicUrl,
  platform: 'admin',
  tokenStore,
});

export const userHooks = createUserHooks(api);
