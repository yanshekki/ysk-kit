import { ERROR_MESSAGE, type ErrorCode } from '@ysk/contracts';

const HTTP_STATUS: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message?: string,
    public readonly status = HTTP_STATUS[code],
    public readonly details?: unknown,
  ) {
    super(message ?? ERROR_MESSAGE[code]['zh-HK']);
    this.name = 'AppError';
  }
}

export class DomainError extends AppError {
  constructor(code: ErrorCode, message?: string, details?: unknown) {
    super(code, message, HTTP_STATUS[code], details);
    this.name = 'DomainError';
  }
}

export type Result<T, E = AppError> = { ok: true; value: T } | { ok: false; error: E };
export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
