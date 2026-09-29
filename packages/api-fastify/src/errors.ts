import { envelopeError, REQUEST_ID_HEADER } from '@ysk/api-http';
import type { FastifyInstance } from 'fastify';

export const registerErrorHandler = (app: FastifyInstance): void => {
  app.setErrorHandler((error, req, reply) => {
    const requestId = String(req.headers[REQUEST_ID_HEADER] ?? crypto.randomUUID());
    const mapped = envelopeError(error, requestId);
    void reply.status(mapped.status).send(mapped.body);
  });
};
