import { type HttpHandler, headerValue, mountContract } from '@ysk/api-express';
import { appContract, type Platform } from '@ysk/contracts';
import { AppError } from '@ysk/domain-kernel';
import type { Express } from 'express';
import type { AuthService } from '../application/auth-service';

const platformOf = (headers: Record<string, string | string[] | undefined>): Platform => {
  const header = headerValue(headers, 'x-ysk-platform') ?? 'web';
  if (
    header === 'admin' ||
    header === 'ios' ||
    header === 'android' ||
    header === 'desktop' ||
    header === 'api'
  ) {
    return header;
  }
  return 'web';
};

export const authHandlers = (auth: AuthService): Record<string, HttpHandler> => ({
  register: {
    handle: async ({ body, headers, requestId }) => ({
      status: 201,
      body: { ok: true, data: await auth.register(body as never, platformOf(headers), requestId) },
    }),
  },
  login: {
    handle: async ({ body, headers, requestId }) => ({
      status: 200,
      body: { ok: true, data: await auth.login(body as never, platformOf(headers), requestId) },
    }),
  },
  requestOtp: {
    handle: async ({ body }) => ({
      status: 200,
      body: { ok: true, data: await auth.requestOtp(body as never) },
    }),
  },
  verifyOtp: {
    handle: async ({ body, headers, requestId }) => ({
      status: 200,
      body: {
        ok: true,
        data: await auth.verifyOtp(body as never, platformOf(headers), requestId),
      },
    }),
  },
  refresh: {
    handle: async ({ body, headers }) => ({
      status: 200,
      body: { ok: true, data: await auth.refresh(body as never, platformOf(headers)) },
    }),
  },
  logout: {
    auth: 'required',
    handle: async ({ auth: claims, requestId }) => {
      if (!claims) throw new AppError('UNAUTHENTICATED');
      return {
        status: 200,
        body: { ok: true, data: await auth.logout(claims, requestId) },
      };
    },
  },
  me: {
    auth: 'required',
    handle: async ({ auth: claims }) => {
      if (!claims) throw new AppError('UNAUTHENTICATED');
      return { status: 200, body: { ok: true, data: await auth.me(claims.sub) } };
    },
  },
  forgot: {
    handle: async ({ body }) => ({
      status: 200,
      body: { ok: true, data: await auth.forgotPassword(body as never) },
    }),
  },
  reset: {
    handle: async ({ body }) => ({
      status: 200,
      body: { ok: true, data: await auth.resetPassword(body as never) },
    }),
  },
  requestAdminOtp: {
    handle: async ({ body }) => ({
      status: 200,
      body: { ok: true, data: await auth.requestAdminOtp(body as never) },
    }),
  },
  verifyAdminOtp: {
    handle: async ({ body, headers, requestId }) => ({
      status: 200,
      body: {
        ok: true,
        data: await auth.verifyAdminOtp(body as never, platformOf(headers), requestId),
      },
    }),
  },
});

export const registerAuthRoutes = (app: Express, auth: AuthService): void => {
  mountContract(app, appContract.auth, authHandlers(auth));
};
