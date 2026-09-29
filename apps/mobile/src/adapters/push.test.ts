import { describe, expect, it, vi } from 'vitest';
import { createDevicePort, enablePush } from './push';

describe('device port', () => {
  it('registers a token through the sdk', async () => {
    const register = vi.fn(async () => ({
      id: 'd1',
      platform: 'ios' as const,
      tokenSuffix: 'tokenxxx',
      createdAt: new Date().toISOString(),
    }));
    const port = createDevicePort({
      api: { devices: { register } } as never,
      platform: 'ios',
    });
    await expect(enablePush(port, async () => 'ExponentPushToken[testtoken]')).resolves.toBe(true);
    expect(register).toHaveBeenCalledWith({
      token: 'ExponentPushToken[testtoken]',
      platform: 'ios',
    });
  });
});
