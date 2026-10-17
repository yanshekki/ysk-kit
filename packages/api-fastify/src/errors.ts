import {
  type EnvelopeErrorLogger,
  envelopeError,
  type HttpErrorRecorder,
  REQUEST_ID_HEADER,
  reportEnvelopeError,
} from '@ysk-kit/api-http';
import type { FastifyInstance } from 'fastify';

export type RegisterErrorHandlerOpts = {
  logger?: EnvelopeErrorLogger;
  recordHttpError?: HttpErrorRecorder;
};

export const registerErrorHandler = (
  app: FastifyInstance,
  opts: RegisterErrorHandlerOpts = {},
): void => {
  app.setErrorHandler((error, req, reply) => {
    const requestId = String(req.headers[REQUEST_ID_HEADER] ?? crypto.randomUUID());
    const mapped = envelopeError(error, requestId);
    reportEnvelopeError(opts, mapped, error);
    void reply.status(mapped.status).send(mapped.body);
  });
};
