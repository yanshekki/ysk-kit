import { z } from 'zod';

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INVITED: 'INVITED',
  SUSPENDED: 'SUSPENDED',
  DELETED: 'DELETED',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
export const USER_STATUS_VALUES = Object.values(UserStatus) as [UserStatus, ...UserStatus[]];
export const UserStatusSchema = z.enum(USER_STATUS_VALUES);

export const USER_STATUS_LABELS: Record<UserStatus, { 'zh-HK': string; en: string }> = {
  ACTIVE: { 'zh-HK': '啟用', en: 'Active' },
  INVITED: { 'zh-HK': '已邀請', en: 'Invited' },
  SUSPENDED: { 'zh-HK': '停用', en: 'Suspended' },
  DELETED: { 'zh-HK': '已刪除', en: 'Deleted' },
};
