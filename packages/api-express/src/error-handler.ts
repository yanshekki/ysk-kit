import { envelopeError, REQUEST_ID_HEADER } from '@ysk/api-http';
import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const requestId = String(req.headers[REQUEST_ID_HEADER] ?? crypto.randomUUID());
  const mapped = envelopeError(error, requestId);
  res.status(mapped.status).json(mapped.body);
};
