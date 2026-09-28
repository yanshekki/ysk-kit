import { type UserRole, type UserStatus } from '@ysk/contracts';

export const formatHkd = (amount: number): string => `$${amount.toLocaleString('en-HK')}`;

export const userStatusLabel = (status: UserStatus, locale: 'zh-HK' | 'en' = 'zh-HK'): string => {
  const map: Record<UserStatus, { 'zh-HK': string; en: string }> = {
    ACTIVE: { 'zh-HK': '啟用', en: 'Active' },
    INVITED: { 'zh-HK': '已邀請', en: 'Invited' },
    SUSPENDED: { 'zh-HK': '停用', en: 'Suspended' },
    DELETED: { 'zh-HK': '已刪除', en: 'Deleted' },
  };
  return map[status][locale];
};

export const canAct = (role: UserRole, action: 'user.suspend' | 'user.create'): boolean => {
  if (action === 'user.create') return role === 'ADMIN' || role === 'OPS';
  if (action === 'user.suspend') return role === 'ADMIN';
  return false;
};
