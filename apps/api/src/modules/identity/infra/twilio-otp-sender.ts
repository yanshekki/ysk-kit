import { AppError } from '@ysk/domain-kernel';
import type { Logger } from '@ysk/logger';
import type { IOtpSender } from '../domain/otp-sender';
import { createDevOtpSender } from './dev-otp-sender';

export type TwilioOtpEnv = {
  NODE_ENV: string;
  TWILIO_ACCOUNT_SID?: string | undefined;
  TWILIO_AUTH_TOKEN?: string | undefined;
  TWILIO_FROM?: string | undefined;
};

export const createTwilioOtpSender = (opts: {
  accountSid: string;
  authToken: string;
  from: string;
  fetchImpl?: typeof fetch;
  logger?: Logger;
}): IOtpSender => {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${opts.accountSid}/Messages.json`;
  const authorization = `Basic ${Buffer.from(`${opts.accountSid}:${opts.authToken}`).toString('base64')}`;
  return {
    async send(phone, code) {
      const res = await fetchImpl(url, {
        method: 'POST',
        headers: {
          authorization,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: phone,
          From: opts.from,
          Body: `YSK code: ${code}`,
        }),
      });
      if (!res.ok) {
        opts.logger?.error({ status: res.status, phone }, 'twilio sms failed');
        throw new AppError('INTERNAL', 'Failed to send verification code');
      }
    },
  };
};

export const createOtpSenderFromEnv = (
  env: TwilioOtpEnv,
  logger: Logger,
  fetchImpl?: typeof fetch,
): IOtpSender => {
  const sid = env.TWILIO_ACCOUNT_SID;
  const token = env.TWILIO_AUTH_TOKEN;
  const from = env.TWILIO_FROM;
  if (sid && token && from) {
    return createTwilioOtpSender({
      accountSid: sid,
      authToken: token,
      from,
      logger,
      ...(fetchImpl ? { fetchImpl } : {}),
    });
  }
  if (env.NODE_ENV === 'production') {
    throw new Error(
      'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM are required in production',
    );
  }
  return createDevOtpSender(logger);
};
