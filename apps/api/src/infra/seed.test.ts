import { describe, expect, it } from 'vitest';
import { assertSeedAllowed } from './seed';

describe('seed guard', () => {
  it('throws in production without ALLOW_SEED', () => {
    expect(() => assertSeedAllowed({ NODE_ENV: 'production' })).toThrow(/ALLOW_SEED=1/);
  });

  it('allows production when ALLOW_SEED=1', () => {
    expect(() => assertSeedAllowed({ NODE_ENV: 'production', ALLOW_SEED: '1' })).not.toThrow();
  });
});
