import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const API_KEY_LIVE_PREFIX = 'ysk_live_';
export const API_KEY_TEST_PREFIX = 'ysk_test_';

export const isApiKeyToken = (token: string): boolean =>
  token.startsWith(API_KEY_LIVE_PREFIX) || token.startsWith(API_KEY_TEST_PREFIX);

export const newApiKey = (live = true): string =>
  `${live ? API_KEY_LIVE_PREFIX : API_KEY_TEST_PREFIX}${randomBytes(32).toString('base64url')}`;

export const prefixOf = (token: string): string => token.slice(0, 24);

export const last4Of = (token: string): string => token.slice(-4);

export const hashKey = (token: string): string => createHash('sha256').update(token).digest('hex');

export const hashesMatch = (left: string, right: string): boolean => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
};
