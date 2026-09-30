import { defaultPublicConfig } from '@ysk-kit/config';
import { createYskClient } from '@ysk-kit/sdk';
import { createSafeStorageTokenStore } from '../adapters/token-store';

export const api = createYskClient({
  baseUrl: defaultPublicConfig().apiPublicUrl,
  platform: 'desktop',
  tokenStore: createSafeStorageTokenStore(),
});
