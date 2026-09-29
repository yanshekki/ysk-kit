import { defaultPublicConfig } from '@ysk/config';
import { createYskClient } from '@ysk/sdk';
import { Platform } from 'react-native';
import { createSecureTokenStore } from '../adapters/token-store';

export const mobilePlatform = Platform.OS === 'ios' ? 'ios' : 'android';

export const api = createYskClient({
  baseUrl: defaultPublicConfig().apiPublicUrl,
  platform: mobilePlatform,
  tokenStore: createSecureTokenStore(),
});
