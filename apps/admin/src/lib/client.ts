import { QueryClient } from '@tanstack/react-query';
import { defaultPublicConfig } from '@ysk/config';
import { createYskClient } from '@ysk/sdk';
import { createUserHooks } from '@ysk/web-sdk';
import { createLocalTokenStore } from '../adapters/token-store';

export const queryClient = new QueryClient();

export const tokenStore = createLocalTokenStore();

export const api = createYskClient({
  baseUrl: defaultPublicConfig().apiPublicUrl,
  platform: 'admin',
  tokenStore,
});

export const userHooks = createUserHooks(api);
