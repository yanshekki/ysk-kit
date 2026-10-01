import { AppError } from '@ysk-kit/domain-kernel';

export type RateLimitOpts = {
  windowMs: number;
  max: number;
  skipPath?: (path: string) => boolean;
};

export const clientIp = (
  forwarded: string | string[] | undefined,
  remote: string | undefined,
): string => {
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const first = raw?.split(',')[0]?.trim();
  if (first && first.length > 0) return first;
  return remote ?? 'unknown';
};

export const isRateLimitSkipped = (path: string): boolean =>
  path === '/metrics' || path === '/health' || path === '/ready';

/** Minimal Redis surface so the HTTP package does not import ioredis. */
export type RateLimitRedis = {
  incr(key: string): Promise<number>;
  pexpire(key: string, milliseconds: number): Promise<unknown>;
};

export type RateLimiter = {
  check(ip: string, path: string): void | Promise<void>;
};

export const createMemoryRateLimit = (opts: RateLimitOpts): RateLimiter => {
  const hits = new Map<string, number[]>();
  const skip = opts.skipPath ?? isRateLimitSkipped;

  return {
    check(ip: string, path: string): void {
      if (skip(path)) return;
      const now = Date.now();
      const windowStart = now - opts.windowMs;
      const recent = (hits.get(ip) ?? []).filter((at) => at > windowStart);
      if (recent.length >= opts.max) {
        hits.set(ip, recent);
        throw new AppError('RATE_LIMITED');
      }
      recent.push(now);
      hits.set(ip, recent);
    },
  };
};

/** Fixed window shared across API processes. Used when `REDIS_URL` is set. */
export const createRedisRateLimit = (
  opts: RateLimitOpts & { redis: RateLimitRedis; now?: () => number; prefix?: string },
): RateLimiter => {
  const skip = opts.skipPath ?? isRateLimitSkipped;
  const prefix = opts.prefix ?? 'ysk-rl';
  return {
    async check(ip: string, path: string): Promise<void> {
      if (skip(path)) return;
      const now = (opts.now ?? Date.now)();
      const bucket = Math.floor(now / opts.windowMs);
      const key = `${prefix}:${ip}:${bucket}`;
      const count = await opts.redis.incr(key);
      if (count === 1) await opts.redis.pexpire(key, opts.windowMs);
      if (count > opts.max) throw new AppError('RATE_LIMITED');
    },
  };
};

export const createRateLimit = (opts: RateLimitOpts & { redis?: RateLimitRedis }): RateLimiter => {
  if (opts.redis) {
    return createRedisRateLimit({
      windowMs: opts.windowMs,
      max: opts.max,
      redis: opts.redis,
      ...(opts.skipPath ? { skipPath: opts.skipPath } : {}),
    });
  }
  return createMemoryRateLimit(opts);
};
