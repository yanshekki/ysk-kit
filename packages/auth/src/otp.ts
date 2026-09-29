import { randomInt } from 'node:crypto';
import { hashRefresh } from './refresh';

export const newOtpCode = (): string => String(randomInt(0, 1_000_000)).padStart(6, '0');

export const hashOtp = (code: string): string => hashRefresh(code);
