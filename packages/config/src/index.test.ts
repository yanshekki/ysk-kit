import { describe, expect, it } from 'vitest';
import { loadServerEnv, PublicConfigSchema } from './index';

describe('config', () => {
  it('loads server env', () => {
    const env = loadServerEnv({
      DATABASE_URL: 'mysql://ysk:ysk@localhost:3306/ysk_kit',
      JWT_SECRET: 'change-me-in-dev-only',
    });
    expect(env.API_PORT).toBe(3001);
    expect(env.NODE_ENV).toBe('development');
    expect(env.RATE_LIMIT_MAX).toBe(300);
    expect(env.RATE_LIMIT_WINDOW_MS).toBe(60_000);
  });

  it('rejects invalid public urls', () => {
    expect(() => PublicConfigSchema.parse({ apiPublicUrl: 'nope' })).toThrow();
  });
});
