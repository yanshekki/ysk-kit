import {
  type EnvelopeErrorLogger,
  envelopeError,
  type HttpErrorRecorder,
  REQUEST_ID_HEADER,
  reportEnvelopeError,
} from '@ysk-kit/api-http';
import type { ErrorRequestHandler } from 'express';

export type CreateErrorHandlerOpts = {
  logger?: EnvelopeErrorLogger;
  recordHttpError?: HttpErrorRecorder;
};

export const createErrorHandler = (opts: CreateErrorHandlerOpts = {}): ErrorRequestHandler => {
  return (error, req, res, _next) => {
    const requestId = String(req.headers[REQUEST_ID_HEADER] ?? crypto.randomUUID());
    const mapped = envelopeError(error, requestId);
    reportEnvelopeError(opts, mapped, error);
    res.status(mapped.status).json(mapped.body);
  };
};

export const errorHandler: ErrorRequestHandler = createErrorHandler();
