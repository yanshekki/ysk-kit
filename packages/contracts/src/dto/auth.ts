import { z } from 'zod';
import { HkPhoneSchema, UserDtoSchema } from './user.js';

export const RegisterCommandSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(80),
});
export type RegisterCommand = z.infer<typeof RegisterCommandSchema>;

export const LoginPasswordCommandSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginPasswordCommand = z.infer<typeof LoginPasswordCommandSchema>;

export const RequestOtpCommandSchema = z.object({
  phone: HkPhoneSchema,
});
export type RequestOtpCommand = z.infer<typeof RequestOtpCommandSchema>;

export const VerifyOtpCommandSchema = z.object({
  phone: HkPhoneSchema,
  code: z.string().regex(/^[0-9]{6}$/),
});
export type VerifyOtpCommand = z.infer<typeof VerifyOtpCommandSchema>;

export const RefreshCommandSchema = z.object({
  refreshToken: z.string().min(16),
});
export type RefreshCommand = z.infer<typeof RefreshCommandSchema>;

export const TokenPairDtoSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int(),
  user: UserDtoSchema,
});
export type TokenPairDto = z.infer<typeof TokenPairDtoSchema>;

export const RequestOtpResultSchema = z.object({
  sent: z.literal(true),
});
export type RequestOtpResult = z.infer<typeof RequestOtpResultSchema>;

export const ForgotPasswordCommandSchema = z.object({
  email: z.string().email(),
});
export type ForgotPasswordCommand = z.infer<typeof ForgotPasswordCommandSchema>;

export const ResetPasswordCommandSchema = z.object({
  token: z.string().min(16),
  password: z.string().min(8).max(128),
});
export type ResetPasswordCommand = z.infer<typeof ResetPasswordCommandSchema>;

export const AcceptedSchema = z.object({ accepted: z.literal(true) });
export type Accepted = z.infer<typeof AcceptedSchema>;

export const RequestAdminOtpCommandSchema = z.object({
  email: z.string().email(),
});
export type RequestAdminOtpCommand = z.infer<typeof RequestAdminOtpCommandSchema>;

export const VerifyAdminOtpCommandSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^[0-9]{6}$/),
});
export type VerifyAdminOtpCommand = z.infer<typeof VerifyAdminOtpCommandSchema>;
