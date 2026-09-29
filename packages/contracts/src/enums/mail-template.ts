import { z } from 'zod';

export const MailTemplate = {
  AUTH_WELCOME: 'auth.welcome',
  AUTH_RESET: 'auth.reset',
  ORG_INVITE: 'org.invite',
  AUTH_ADMIN_OTP: 'auth.admin-otp',
} as const;

export type MailTemplate = (typeof MailTemplate)[keyof typeof MailTemplate];
export const MAIL_TEMPLATE_VALUES = Object.values(MailTemplate) as [
  MailTemplate,
  ...MailTemplate[],
];
export const MailTemplateSchema = z.enum(MAIL_TEMPLATE_VALUES);

export type MailLocale = 'zh-HK' | 'en';

export const MAIL_COPY: Record<
  MailTemplate,
  { subject: Record<MailLocale, string>; body: Record<MailLocale, string> }
> = {
  'auth.welcome': {
    subject: { 'zh-HK': '歡迎使用 YSK Kit', en: 'Welcome to YSK Kit' },
    body: {
      'zh-HK': '你好 {{displayName}}，你嘅帳號已建立。',
      en: 'Hello {{displayName}}, your account is ready.',
    },
  },
  'auth.reset': {
    subject: { 'zh-HK': '重設密碼', en: 'Reset your password' },
    body: {
      'zh-HK': '喺一個鐘內開啟呢個連結重設密碼：{{resetUrl}}',
      en: 'Open this link within one hour to reset your password: {{resetUrl}}',
    },
  },
  'org.invite': {
    subject: { 'zh-HK': '邀請加入 {{organizationName}}', en: 'Invite to {{organizationName}}' },
    body: {
      'zh-HK': '你被邀請加入 {{organizationName}}。七日内開啟呢個連結：{{inviteUrl}}',
      en: 'You were invited to {{organizationName}}. Open this link within seven days: {{inviteUrl}}',
    },
  },
  'auth.admin-otp': {
    subject: { 'zh-HK': '管理員登入驗證碼', en: 'Admin sign-in code' },
    body: {
      'zh-HK': '你嘅管理員驗證碼係 {{code}}，請喺期限內輸入。',
      en: 'Your admin sign-in code is {{code}}. Enter it before it expires.',
    },
  },
};
