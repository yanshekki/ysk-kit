import { describe, expect, it } from 'vitest';
import { canAct, formatHkd } from './index';

describe('ui-logic', () => {
  it('formats HKD as integer dollars', () => {
    expect(formatHkd(350)).toBe('$350');
  });

  it('only lets admin suspend users', () => {
    expect(canAct('ADMIN', 'user.suspend')).toBe(true);
    expect(canAct('USER', 'user.suspend')).toBe(false);
  });
});
