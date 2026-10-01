import { AppError } from '@ysk-kit/domain-kernel';
import { describe, expect, it } from 'vitest';
import { clientIp, createMemoryRateLimit, createRedisRateLimit } from './rate-limit';

describe('createMemoryRateLimit', () => {
  it('throws RATE_LIMITED after max hits in the window', () => {
    const limiter = createMemoryRateLimit({ windowMs: 60_000, max: 2 });
    limiter.check('1.1.1.1', '/v1/auth/login');
    limiter.check('1.1.1.1', '/v1/auth/login');
    try {
      limiter.check('1.1.1.1', '/v1/auth/login');
      expect.fail('expected RATE_LIMITED');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe('RATE_LIMITED');
    }
    limiter.check('2.2.2.2', '/v1/auth/login');
    limiter.check('1.1.1.1', '/health');
  });

  it('shares a Redis fixed window and skips health', async () => {
    const keys = new Map<string, number>();
    const redis = {
      incr: (key: string) => {
        const next = (keys.get(key) ?? 0) + 1;
        keys.set(key, next);
        return Promise.resolve(next);
      },
      pexpire: () => Promise.resolve(1),
    };
    const limiter = createRedisRateLimit({
      windowMs: 60_000,
      max: 1,
      redis,
      now: () => 60_000,
    });
    await limiter.check('1.1.1.1', '/v1/auth/login');
    await expect(limiter.check('1.1.1.1', '/v1/auth/login')).rejects.toMatchObject({
      code: 'RATE_LIMITED',
    });
    await expect(limiter.check('1.1.1.1', '/health')).resolves.toBeUndefined();
    expect(keys.has('ysk-rl:1.1.1.1:1')).toBe(true);
  });

  it('reads the first x-forwarded-for hop', () => {
    expect(clientIp('10.0.0.1, 10.0.0.2', '127.0.0.1')).toBe('10.0.0.1');
    expect(clientIp(undefined, '127.0.0.1')).toBe('127.0.0.1');
  });
});
