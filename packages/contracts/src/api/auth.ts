import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  AcceptedSchema,
  ForgotPasswordCommandSchema,
  LoginPasswordCommandSchema,
  RefreshCommandSchema,
  RegisterCommandSchema,
  RequestAdminOtpCommandSchema,
  RequestOtpCommandSchema,
  RequestOtpResultSchema,
  ResetPasswordCommandSchema,
  TokenPairDtoSchema,
  VerifyAdminOtpCommandSchema,
  VerifyOtpCommandSchema,
} from '../dto/auth';
import { UserDtoSchema } from '../dto/user';
import { ErrSchema, OkSchema } from '../errors/envelope';

const c = initContract();

export const authContract = c.router({
  register: {
    method: 'POST',
    path: '/v1/auth/register',
    body: RegisterCommandSchema,
    responses: { 201: OkSchema(TokenPairDtoSchema), 409: ErrSchema, 422: ErrSchema },
    summary: 'Register with email',
  },
  login: {
    method: 'POST',
    path: '/v1/auth/login',
    body: LoginPasswordCommandSchema,
    responses: { 200: OkSchema(TokenPairDtoSchema), 401: ErrSchema, 422: ErrSchema },
    summary: 'Login with email and password',
  },
  requestOtp: {
    method: 'POST',
    path: '/v1/auth/otp/request',
    body: RequestOtpCommandSchema,
    responses: { 200: OkSchema(RequestOtpResultSchema), 429: ErrSchema, 422: ErrSchema },
    summary: 'Request SMS OTP',
  },
  verifyOtp: {
    method: 'POST',
    path: '/v1/auth/otp/verify',
    body: VerifyOtpCommandSchema,
    responses: { 200: OkSchema(TokenPairDtoSchema), 401: ErrSchema, 422: ErrSchema },
    summary: 'Verify SMS OTP',
  },
  refresh: {
    method: 'POST',
    path: '/v1/auth/refresh',
    body: RefreshCommandSchema,
    responses: { 200: OkSchema(TokenPairDtoSchema), 401: ErrSchema },
    summary: 'Rotate refresh token',
  },
  logout: {
    method: 'POST',
    path: '/v1/auth/logout',
    body: z.object({}).optional(),
    responses: { 200: OkSchema(z.object({ revoked: z.literal(true) })), 401: ErrSchema },
    summary: 'Revoke current session',
  },
  me: {
    method: 'GET',
    path: '/v1/me',
    responses: { 200: OkSchema(UserDtoSchema), 401: ErrSchema },
    summary: 'Current user',
  },
  forgot: {
    method: 'POST',
    path: '/v1/auth/forgot',
    body: ForgotPasswordCommandSchema,
    responses: { 200: OkSchema(AcceptedSchema), 422: ErrSchema },
    summary: 'Request a password reset email',
  },
  reset: {
    method: 'POST',
    path: '/v1/auth/reset',
    body: ResetPasswordCommandSchema,
    responses: { 200: OkSchema(AcceptedSchema), 401: ErrSchema, 422: ErrSchema },
    summary: 'Reset password with token',
  },
  requestAdminOtp: {
    method: 'POST',
    path: '/v1/auth/admin/otp/request',
    body: RequestAdminOtpCommandSchema,
    responses: { 200: OkSchema(RequestOtpResultSchema), 429: ErrSchema, 422: ErrSchema },
    summary: 'Request admin email OTP',
  },
  verifyAdminOtp: {
    method: 'POST',
    path: '/v1/auth/admin/otp/verify',
    body: VerifyAdminOtpCommandSchema,
    responses: { 200: OkSchema(TokenPairDtoSchema), 401: ErrSchema, 422: ErrSchema },
    summary: 'Verify admin email OTP',
  },
});
