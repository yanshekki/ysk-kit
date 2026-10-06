import { describe, expect, it } from 'vitest';
import { parseTtlSeconds, signAccessToken, verifyAccessToken } from './jwt.js';
import { newOtpCode } from './otp.js';
import { hashPassword, verifyPassword } from './password.js';
import { hashRefresh, newRefreshToken } from './refresh.js';

describe('auth crypto', () => {
  it('hashes and verifies passwords', async () => {
    const hash = await hashPassword('secret-pass');
    await expect(verifyPassword(hash, 'secret-pass')).resolves.toBe(true);
    await expect(verifyPassword(hash, 'nope')).resolves.toBe(false);
  });

  it('signs and verifies access tokens', async () => {
    const token = await signAccessToken(
      { sub: 'u1', role: 'ADMIN', platform: 'web', sid: 's1' },
      'test-secret-key-must-be-long',
      60,
    );
    const claims = await verifyAccessToken(token, 'test-secret-key-must-be-long');
    expect(claims.sub).toBe('u1');
    expect(claims.role).toBe('ADMIN');
    expect(claims.sid).toBe('s1');
  });

  it('parses ttl and hashes refresh tokens', () => {
    expect(parseTtlSeconds('15m')).toBe(900);
    const a = newRefreshToken();
    const b = newRefreshToken();
    expect(a).not.toBe(b);
    expect(hashRefresh(a)).toHaveLength(64);
  });

  it('creates 6-digit otp codes', () => {
    expect(newOtpCode()).toMatch(/^[0-9]{6}$/);
  });
});
