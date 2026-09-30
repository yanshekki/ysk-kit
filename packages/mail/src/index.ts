import { MAIL_COPY, type MailLocale, type MailTemplate } from '@ysk-kit/contracts';
import type { Transporter } from 'nodemailer';

export type MailMessage = {
  to: string;
  template: MailTemplate;
  locale: MailLocale;
  vars: Record<string, string>;
};

export interface IMailPort {
  send(message: MailMessage): Promise<void>;
}

const interpolate = (template: string, vars: Record<string, string>): string =>
  template.replace(/\{\{(\w+)\}\}/g, (_m, key: string) => vars[key] ?? '');

export const renderMail = (
  template: MailTemplate,
  locale: MailLocale,
  vars: Record<string, string>,
): { subject: string; text: string } => {
  const copy = MAIL_COPY[template];
  return {
    subject: interpolate(copy.subject[locale], vars),
    text: interpolate(copy.body[locale], vars),
  };
};

export const createLogMailer = (
  sink: Array<{ to: string; template: MailTemplate; subject: string }> = [],
): IMailPort & { sink: typeof sink } => ({
  sink,
  async send(message) {
    const { subject } = renderMail(message.template, message.locale, message.vars);
    sink.push({ to: message.to, template: message.template, subject });
  },
});

export const createSmtpMailer = (opts: { smtpUrl: string; from: string }): IMailPort => {
  let transport: Transporter | undefined;
  return {
    async send(message) {
      const nodemailer = await import('nodemailer');
      transport ??= nodemailer.createTransport(opts.smtpUrl);
      const rendered = renderMail(message.template, message.locale, message.vars);
      await transport.sendMail({
        from: opts.from,
        to: message.to,
        subject: rendered.subject,
        text: rendered.text,
      });
    },
  };
};

export const createMailerFromEnv = (env: {
  SMTP_URL?: string | undefined;
  MAIL_FROM?: string | undefined;
}): IMailPort => {
  if (env.SMTP_URL) {
    return createSmtpMailer({ smtpUrl: env.SMTP_URL, from: env.MAIL_FROM ?? 'ysk-kit@localhost' });
  }
  return createLogMailer();
};
