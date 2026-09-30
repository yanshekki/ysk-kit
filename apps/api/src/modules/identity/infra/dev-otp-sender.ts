import type { Logger } from '@ysk-kit/logger';
import type { IOtpSender } from '../domain/otp-sender';

export const createDevOtpSender = (logger: Logger): IOtpSender => ({
  async send(phone, code) {
    logger.info({ phone, code }, 'dev otp code');
  },
});
