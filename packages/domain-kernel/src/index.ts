import { ERROR_MESSAGE, type ErrorCode } from '@ysk/contracts';

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message?: string,
    public readonly status = 400,
    public readonly details?: unknown,
  ) {
    super(message ?? ERROR_MESSAGE[code]['zh-HK']);
    this.name = 'AppError';
  }
}

export type Result<T, E = AppError> = { ok: true; value: T } | { ok: false; error: E };
export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
