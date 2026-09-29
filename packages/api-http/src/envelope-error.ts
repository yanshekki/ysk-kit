import { ERROR_MESSAGE } from '@ysk/contracts';
import { AppError } from '@ysk/domain-kernel';
import { ZodError } from 'zod';

export type EnvelopeErrorJson = {
  status: number;
  body: {
    ok: false;
    error: {
      code: string;
      message: string;
      details?: unknown;
      requestId: string;
    };
  };
};

export const envelopeError = (error: unknown, requestId: string): EnvelopeErrorJson => {
  if (error instanceof ZodError) {
    return {
      status: 422,
      body: {
        ok: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: ERROR_MESSAGE.VALIDATION_FAILED['zh-HK'],
          details: error.flatten(),
          requestId,
        },
      },
    };
  }
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details !== undefined ? { details: error.details } : {}),
          requestId,
        },
      },
    };
  }
  return {
    status: 500,
    body: {
      ok: false,
      error: {
        code: 'INTERNAL',
        message: ERROR_MESSAGE.INTERNAL['zh-HK'],
        requestId,
      },
    },
  };
};
