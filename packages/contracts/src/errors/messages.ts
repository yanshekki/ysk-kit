import type { ErrorCode } from './codes.js';

export const ERROR_MESSAGE: Record<ErrorCode, { 'zh-HK': string; en: string }> = {
  VALIDATION_FAILED: { 'zh-HK': '資料格式不正確', en: 'Validation failed' },
  UNAUTHENTICATED: { 'zh-HK': '尚未登入', en: 'Unauthenticated' },
  FORBIDDEN: { 'zh-HK': '沒有權限', en: 'Forbidden' },
  NOT_FOUND: { 'zh-HK': '找不到資料', en: 'Not found' },
  CONFLICT: { 'zh-HK': '狀態衝突', en: 'Conflict' },
  RATE_LIMITED: { 'zh-HK': '請求過於頻密', en: 'Rate limited' },
  INTERNAL: { 'zh-HK': '系統錯誤', en: 'Internal error' },
};
