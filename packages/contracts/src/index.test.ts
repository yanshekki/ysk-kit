import { describe, expect, it } from 'vitest';
import { CreateUserCommandSchema, USER_STATUS_VALUES, UserStatus } from './index';

describe('contracts', () => {
  it('keeps user status literals stable', () => {
    expect(USER_STATUS_VALUES).toContain(UserStatus.ACTIVE);
  });

  it('parses create user command', () => {
    const parsed = CreateUserCommandSchema.parse({
      email: 'dev@ysk.hk',
      displayName: 'Ki',
    });
    expect(parsed.role).toBe('USER');
  });
});
