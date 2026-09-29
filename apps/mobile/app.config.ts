import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'YSK Kit',
  slug: 'ysk-kit',
  scheme: 'yskkit',
  version: '0.1.0',
  orientation: 'portrait',
  platforms: ['ios', 'android'],
  ios: { bundleIdentifier: 'hk.ysk.kit', supportsTablet: true },
  android: { package: 'hk.ysk.kit' },
  extra: { eas: { projectId: 'replace-me' } },
};

export default config;
