import { describe, expect, it } from 'vitest';
import { canAct, formatHkd, orgRoleCan } from './index';

describe('ui-logic', () => {
  it('formats HKD as integer dollars', () => {
    expect(formatHkd(350)).toBe('$350');
  });

  it('maps roles to permissions from contracts', () => {
    expect(canAct('ADMIN', 'user.suspend')).toBe(true);
    expect(canAct('USER', 'user.suspend')).toBe(false);
    expect(canAct('USER', 'file.upload')).toBe(true);
    expect(canAct('USER', 'llm.use')).toBe(true);
    expect(canAct('OPS', 'user.create')).toBe(true);
    expect(canAct('OPS', 'user.suspend')).toBe(false);
  });

  it('maps org roles to org actions', () => {
    expect(orgRoleCan('OWNER', 'org.update')).toBe(true);
    expect(orgRoleCan('ADMIN', 'org.invite')).toBe(true);
    expect(orgRoleCan('MEMBER', 'org.member.remove')).toBe(false);
  });
});
