import { describe, expect, it } from 'vitest';
import {
  appContract,
  CreateUserCommandSchema,
  HkPhoneSchema,
  orgRoleCan,
  ROLE_PERMISSIONS,
  USER_STATUS_LABELS,
  USER_STATUS_VALUES,
  UserStatus,
} from './index';

describe('contracts', () => {
  it('keeps user status literals stable', () => {
    expect(USER_STATUS_VALUES).toContain(UserStatus.ACTIVE);
    expect(USER_STATUS_LABELS.ACTIVE.en).toBe('Active');
  });

  it('parses create user command', () => {
    const parsed = CreateUserCommandSchema.parse({
      email: 'dev@ysk.hk',
      displayName: 'Ki',
    });
    expect(parsed.role).toBe('USER');
  });

  it('accepts Hong Kong mobile numbers', () => {
    expect(HkPhoneSchema.parse('+85291234567')).toBe('+85291234567');
    expect(() => HkPhoneSchema.parse('91234567')).toThrow();
  });

  it('grants admin every permission', () => {
    expect(ROLE_PERMISSIONS.ADMIN).toContain('user.suspend');
  });

  it('scopes org actions by membership role', () => {
    expect(orgRoleCan('OWNER', 'org.update')).toBe(true);
    expect(orgRoleCan('ADMIN', 'org.invite')).toBe(true);
    expect(orgRoleCan('MEMBER', 'org.invite')).toBe(false);
    expect(orgRoleCan('OWNER', 'org.billing')).toBe(true);
    expect(orgRoleCan('ADMIN', 'org.billing')).toBe(true);
    expect(orgRoleCan('MEMBER', 'org.billing')).toBe(false);
  });

  it('exports a ts-rest app contract with health, auth and users', () => {
    expect(appContract.health.get.path).toBe('/health');
    expect(appContract.health.ready.path).toBe('/ready');
    expect(appContract.auth.login.path).toBe('/v1/auth/login');
    expect(appContract.users.list.path).toBe('/v1/users');
    expect(appContract.users.create.method).toBe('POST');
    expect(appContract.users.suspend.path).toBe('/v1/users/:id/suspend');
    expect(appContract.organizations.create.path).toBe('/v1/organizations');
    expect(appContract.organizations.acceptInvite.path).toBe('/v1/organizations/invites/accept');
  });
});
