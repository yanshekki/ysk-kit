export interface DevicePort {
  platform: 'ios' | 'android';
  registerPushToken(token: string): Promise<void>;
}
