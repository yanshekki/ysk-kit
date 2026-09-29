import { defaultPublicConfig } from '@ysk/config';
import { createYskClient } from '@ysk/sdk';
import { createSafeStorageTokenStore } from '../adapters/token-store';

export const api = createYskClient({
  baseUrl: defaultPublicConfig().apiPublicUrl,
  platform: 'desktop',
  tokenStore: createSafeStorageTokenStore(),
});
