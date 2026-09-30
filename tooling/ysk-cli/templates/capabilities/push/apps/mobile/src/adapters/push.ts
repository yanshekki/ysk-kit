import type { DevicePort, YskClient } from '@ysk-kit/sdk';

export const createDevicePort = (opts: {
  api: YskClient;
  platform: 'ios' | 'android';
}): DevicePort => ({
  platform: opts.platform,
  registerPushToken: async (token) => {
    await opts.api.devices.register({ token, platform: opts.platform });
  },
});

export const enablePush = async (
  port: DevicePort,
  getToken: () => Promise<string | null>,
): Promise<boolean> => {
  const token = await getToken();
  if (!token) return false;
  await port.registerPushToken(token);
  return true;
};
