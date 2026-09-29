import { z } from 'zod';

export const AuthMethod = {
  PASSWORD: 'PASSWORD',
  OTP: 'OTP',
} as const;

export type AuthMethod = (typeof AuthMethod)[keyof typeof AuthMethod];
export const AUTH_METHOD_VALUES = Object.values(AuthMethod) as [AuthMethod, ...AuthMethod[]];
export const AuthMethodSchema = z.enum(AUTH_METHOD_VALUES);
