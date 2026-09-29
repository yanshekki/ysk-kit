import { AppError } from '@ysk/domain-kernel';

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

export const createMemoryRateLimit = (opts: RateLimitOpts) => {
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
