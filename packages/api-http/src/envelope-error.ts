import { ERROR_MESSAGE } from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
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

export type EnvelopeLogLevel = 'error' | 'silent';

export type EnvelopeLogClassification = {
  level: EnvelopeLogLevel;
  requestId: string;
  code: string;
  status: number;
};

/** INTERNAL or HTTP status ≥ 500 is actionable ERROR. Expected 4xx AppError stays silent. */
export const classifyEnvelopeLog = (mapped: EnvelopeErrorJson): EnvelopeLogClassification => {
  const code = mapped.body.error.code;
  const unexpected = code === 'INTERNAL' || mapped.status >= 500;
  return {
    level: unexpected ? 'error' : 'silent',
    requestId: mapped.body.error.requestId,
    code,
    status: mapped.status,
  };
};

export type EnvelopeErrorLogger = {
  error: (obj: Record<string, unknown>, msg?: string) => void;
};

export type HttpErrorRecorder = (input: { code: string; status: number }) => void;

export const reportEnvelopeError = (
  hooks: { logger?: EnvelopeErrorLogger; recordHttpError?: HttpErrorRecorder },
  mapped: EnvelopeErrorJson,
  error: unknown,
): void => {
  const classified = classifyEnvelopeLog(mapped);
  if (classified.level !== 'error') return;
  hooks.logger?.error(
    {
      err: error,
      requestId: classified.requestId,
      code: classified.code,
      status: classified.status,
    },
    'request failed',
  );
  hooks.recordHttpError?.({ code: classified.code, status: classified.status });
};
