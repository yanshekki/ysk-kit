import { createFcmPush, hasFcmEnv } from './fcm';
import type { IPushPort } from './port';

export { createFcmPush, hasFcmEnv } from './fcm';
export type { IPushPort, PushMessage, PushResult } from './port';
export const isExpoPushToken = (token: string): boolean => token.startsWith('ExponentPushToken[');

export const createLogPush = (
  sink: Array<{ title: string; tokenSuffix: string }> = [],
): IPushPort & { sink: typeof sink } => ({
  sink,
  async send(message) {
    sink.push({ title: message.title, tokenSuffix: message.token.slice(-8) });
    return 'ok';
  },
});

export const createExpoPush = (opts?: {
  fetchImpl?: typeof fetch;
  accessToken?: string | undefined;
}): IPushPort => ({
  async send(message) {
    if (!isExpoPushToken(message.token)) return 'error';
    const fetchImpl = opts?.fetchImpl ?? fetch;
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (opts?.accessToken) headers.authorization = `Bearer ${opts.accessToken}`;
    const res = await fetchImpl('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to: message.token,
        title: message.title,
        body: message.body,
        data: message.data ?? {},
      }),
    });
    if (!res.ok) return 'error';
    const json = (await res.json()) as {
      data?: { status?: string; details?: { error?: string } };
    };
    const status = json.data?.status;
    const err = json.data?.details?.error;
    if (err === 'DeviceNotRegistered') return 'invalid-token';
    if (status === 'ok') return 'ok';
    return 'error';
  },
});

export const createPushFromEnv = (
  env: {
    EXPO_ACCESS_TOKEN?: string | undefined;
    FCM_PROJECT_ID?: string | undefined;
    FCM_CLIENT_EMAIL?: string | undefined;
    FCM_PRIVATE_KEY?: string | undefined;
  },
  opts?: { fetchImpl?: typeof fetch },
): IPushPort => {
  const expo = createExpoPush({
    ...(opts?.fetchImpl ? { fetchImpl: opts.fetchImpl } : {}),
    accessToken: env.EXPO_ACCESS_TOKEN,
  });
  const log = createLogPush();
  const fcm = hasFcmEnv(env)
    ? createFcmPush({
        projectId: env.FCM_PROJECT_ID,
        clientEmail: env.FCM_CLIENT_EMAIL,
        privateKey: env.FCM_PRIVATE_KEY,
        ...(opts?.fetchImpl ? { fetchImpl: opts.fetchImpl } : {}),
      })
    : null;
  return {
    async send(message) {
      if (isExpoPushToken(message.token)) return expo.send(message);
      if (fcm) return fcm.send(message);
      return log.send(message);
    },
  };
};
