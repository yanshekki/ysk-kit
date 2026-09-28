import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@ysk/domain-kernel';
import { ERROR_MESSAGE } from '@ysk/contracts';

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const requestId = String(req.headers['x-request-id'] ?? crypto.randomUUID());
  if (error instanceof ZodError) {
    res.status(422).json({
      ok: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: ERROR_MESSAGE.VALIDATION_FAILED['zh-HK'],
        details: error.flatten(),
        requestId,
      },
    });
    return;
  }
  if (error instanceof AppError) {
    res.status(error.status).json({
      ok: false,
      error: { code: error.code, message: error.message, details: error.details, requestId },
    });
    return;
  }
  res.status(500).json({
    ok: false,
    error: { code: 'INTERNAL', message: ERROR_MESSAGE.INTERNAL['zh-HK'], requestId },
  });
};
