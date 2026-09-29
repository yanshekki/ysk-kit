import { describe, expect, it } from 'vitest';
import { hashesMatch, hashKey, isApiKeyToken, last4Of, newApiKey, prefixOf } from './index';

describe('apikey', () => {
  it('mints a live token and stable prefix/hash', () => {
    const token = newApiKey();
    expect(isApiKeyToken(token)).toBe(true);
    expect(prefixOf(token)).toHaveLength(24);
    expect(last4Of(token)).toHaveLength(4);
    expect(hashesMatch(hashKey(token), hashKey(token))).toBe(true);
    expect(hashesMatch(hashKey(token), hashKey(`${token}x`))).toBe(false);
  });
});
