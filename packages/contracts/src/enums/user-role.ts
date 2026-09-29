import { z } from 'zod';

export const UserRole = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  OPS: 'OPS',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export const USER_ROLE_VALUES = Object.values(UserRole) as [UserRole, ...UserRole[]];
export const UserRoleSchema = z.enum(USER_ROLE_VALUES);

export const USER_ROLE_LABELS: Record<UserRole, { 'zh-HK': string; en: string }> = {
  USER: { 'zh-HK': '用戶', en: 'User' },
  ADMIN: { 'zh-HK': '管理員', en: 'Admin' },
  OPS: { 'zh-HK': '營運', en: 'Ops' },
};
