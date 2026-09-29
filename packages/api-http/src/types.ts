import type { AccessClaims } from '@ysk/auth';
import type { Permission } from '@ysk/contracts';

export type HttpCtx = {
  auth?: AccessClaims;
  body: unknown;
  query: unknown;
  params: unknown;
  requestId: string;
  headers: Record<string, string | string[] | undefined>;
};

export type HttpResult = {
  status: number;
  body: unknown;
};

export type HttpHandler = {
  auth?: 'required';
  permission?: Permission;
  handle: (ctx: HttpCtx) => Promise<HttpResult>;
};

export const headerValue = (headers: HttpCtx['headers'], name: string): string | undefined => {
  const value = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return value;
};
