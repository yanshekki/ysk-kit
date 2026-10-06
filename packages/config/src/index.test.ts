import { describe, expect, it } from 'vitest';
import { llmQuotaFromEnv, loadServerEnv, PublicConfigSchema } from './index.js';

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
    expect(env.LLM_QUOTA_MAX).toBe(60);
    expect(env.LLM_QUOTA_WINDOW_MS).toBe(3_600_000);
    expect(env.LLM_SYSTEM_PROMPT.length).toBeGreaterThan(0);
  });

  it('disables the LLM quota when LLM_QUOTA_MAX is 0', () => {
    const env = loadServerEnv({
      DATABASE_URL: 'mysql://ysk:ysk@localhost:3306/ysk_kit',
      JWT_SECRET: 'change-me-in-dev-only',
      LLM_QUOTA_MAX: '0',
    });
    expect(llmQuotaFromEnv(env)).toBeUndefined();
  });

  it('rejects invalid public urls', () => {
    expect(() => PublicConfigSchema.parse({ apiPublicUrl: 'nope' })).toThrow();
  });

  it('rejects the development JWT secret and short secrets in production', () => {
    const base = { NODE_ENV: 'production', DATABASE_URL: 'mysql://ysk:ysk@localhost:3306/ysk_kit' };
    expect(() => loadServerEnv({ ...base, JWT_SECRET: 'change-me-in-dev-only' })).toThrow(
      /JWT_SECRET/,
    );
    expect(() => loadServerEnv({ ...base, JWT_SECRET: 'short-but-over-8' })).toThrow(/JWT_SECRET/);
    const env = loadServerEnv({ ...base, JWT_SECRET: 'p'.repeat(32) });
    expect(env.JWT_SECRET).toHaveLength(32);
  });
});
