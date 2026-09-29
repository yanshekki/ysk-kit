import { createSign } from 'node:crypto';
import type { IPushPort, PushResult } from './port';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

export type FcmEnv = {
  FCM_PROJECT_ID: string;
  FCM_CLIENT_EMAIL: string;
  FCM_PRIVATE_KEY: string;
};

const b64url = (value: string): string => Buffer.from(value).toString('base64url');

const normalizePem = (key: string): string => key.replace(/\\n/g, '\n');

const signServiceJwt = (email: string, pem: string, nowSec: number): string => {
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(
    JSON.stringify({
      iss: email,
      sub: email,
      aud: TOKEN_URL,
      iat: nowSec,
      exp: nowSec + 3600,
      scope: SCOPE,
    }),
  );
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(normalizePem(pem), 'base64url');
  return `${header}.${payload}.${sig}`;
};

const isUnregistered = (json: unknown): boolean => {
  if (!json || typeof json !== 'object') return false;
  const err = (json as { error?: { status?: string; details?: Array<{ errorCode?: string }> } })
    .error;
  if (err?.status === 'NOT_FOUND' || err?.status === 'UNREGISTERED') return true;
  return Boolean(err?.details?.some((row) => row.errorCode === 'UNREGISTERED'));
};

export const createFcmPush = (opts: {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
}): IPushPort => {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const now = () => opts.now?.() ?? Math.floor(Date.now() / 1000);
  let cached: { token: string; exp: number } | undefined;
  const sendUrl = `https://fcm.googleapis.com/v1/projects/${opts.projectId}/messages:send`;

  const accessToken = async (): Promise<string | null> => {
    const t = now();
    if (cached && cached.exp - 60 > t) return cached.token;
    const assertion = signServiceJwt(opts.clientEmail, opts.privateKey, t);
    const res = await fetchImpl(TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!json.access_token) return null;
    cached = { token: json.access_token, exp: t + (json.expires_in ?? 3600) };
    return json.access_token;
  };

  return {
    async send(message): Promise<PushResult> {
      const bearer = await accessToken();
      if (!bearer) return 'error';
      const payload: {
        message: {
          token: string;
          notification: { title: string; body: string };
          data?: Record<string, string>;
        };
      } = {
        message: {
          token: message.token,
          notification: { title: message.title, body: message.body },
        },
      };
      if (message.data) payload.message.data = message.data;
      const res = await fetchImpl(sendUrl, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${bearer}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) return 'ok';
      let json: unknown = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }
      if (isUnregistered(json)) return 'invalid-token';
      return 'error';
    },
  };
};

export const hasFcmEnv = (env: {
  FCM_PROJECT_ID?: string | undefined;
  FCM_CLIENT_EMAIL?: string | undefined;
  FCM_PRIVATE_KEY?: string | undefined;
}): env is FcmEnv => Boolean(env.FCM_PROJECT_ID && env.FCM_CLIENT_EMAIL && env.FCM_PRIVATE_KEY);
