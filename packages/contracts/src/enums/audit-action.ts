import { z } from 'zod';

export const AuditAction = {
  AUTH_REGISTER: 'auth.register',
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_RESET: 'auth.reset',
  USER_CREATE: 'user.create',
  USER_SUSPEND: 'user.suspend',
  FILE_UPLOAD: 'file.upload',
  ORG_CREATE: 'org.create',
  ORG_INVITE: 'org.invite',
  ORG_MEMBER_REMOVE: 'org.member.remove',
  API_KEY_CREATE: 'api_key.create',
  API_KEY_REVOKE: 'api_key.revoke',
} as const;

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
export const AUDIT_ACTION_VALUES = Object.values(AuditAction) as [AuditAction, ...AuditAction[]];
export const AuditActionSchema = z.enum(AUDIT_ACTION_VALUES);
