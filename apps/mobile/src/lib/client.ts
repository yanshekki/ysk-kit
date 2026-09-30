import { defaultPublicConfig } from '@ysk-kit/config';
import { createYskClient } from '@ysk-kit/sdk';
import { Platform } from 'react-native';
import { createSecureTokenStore } from '../adapters/token-store';

export const mobilePlatform = Platform.OS === 'ios' ? 'ios' : 'android';

export const api = createYskClient({
  baseUrl: defaultPublicConfig().apiPublicUrl,
  platform: mobilePlatform,
  tokenStore: createSecureTokenStore(),
});
