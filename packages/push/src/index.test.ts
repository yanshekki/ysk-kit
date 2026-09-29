import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createFcmPush } from './fcm';
import { createExpoPush, createLogPush, createPushFromEnv, isExpoPushToken } from './index';

const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
const privateKey = rsa.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

describe('push', () => {
  it('log adapter never stores the full token', async () => {
    const push = createLogPush();
    await push.send({
      token: 'ExponentPushToken[abcdefghijklmnop]',
      title: 'Hi',
      body: 'There',
    });
    expect(push.sink[0]?.tokenSuffix).toHaveLength(8);
    expect(JSON.stringify(push.sink)).not.toContain('ExponentPushToken');
  });

  it('expo adapter maps DeviceNotRegistered', async () => {
    const push = createExpoPush({
      fetchImpl: async () =>
        new Response(
          JSON.stringify({ data: { status: 'error', details: { error: 'DeviceNotRegistered' } } }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
    });
    await expect(
      push.send({ token: 'ExponentPushToken[abc]', title: 't', body: 'b' }),
    ).resolves.toBe('invalid-token');
    expect(isExpoPushToken('ExponentPushToken[abc]')).toBe(true);
  });

  it('fcm adapter sends after oauth and maps UNREGISTERED', async () => {
    const urls: string[] = [];
    const push = createFcmPush({
      projectId: 'p1',
      clientEmail: 'fcm@p1.iam.gserviceaccount.com',
      privateKey,
      now: () => 1_700_000_000,
      fetchImpl: async (url) => {
        urls.push(String(url));
        if (String(url).includes('oauth2.googleapis.com')) {
          return new Response(JSON.stringify({ access_token: 'ya29.test', expires_in: 3600 }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        }
        return new Response(
          JSON.stringify({
            error: { status: 'NOT_FOUND', details: [{ errorCode: 'UNREGISTERED' }] },
          }),
          { status: 404, headers: { 'content-type': 'application/json' } },
        );
      },
    });
    await expect(
      push.send({ token: 'native-fcm-token-xxxxx', title: 't', body: 'b' }),
    ).resolves.toBe('invalid-token');
    expect(urls.some((row) => row.includes('oauth2.googleapis.com'))).toBe(true);
    expect(urls.some((row) => row.includes('/v1/projects/p1/messages:send'))).toBe(true);
  });

  it('createPushFromEnv uses Expo for Expo tokens and log without FCM', async () => {
    const urls: string[] = [];
    const push = createPushFromEnv(
      {},
      {
        fetchImpl: async (url) => {
          urls.push(String(url));
          return new Response('{}', { status: 200 });
        },
      },
    );
    const native = await push.send({ token: 'native-token-abcdefgh', title: 't', body: 'b' });
    expect(native).toBe('ok');
    expect(urls).toHaveLength(0);
    await push.send({
      token: 'ExponentPushToken[abc]',
      title: 't',
      body: 'b',
    });
    expect(urls.some((row) => row.includes('exp.host'))).toBe(true);
    expect(urls.some((row) => row.includes('fcm.googleapis.com'))).toBe(false);
  });
});
