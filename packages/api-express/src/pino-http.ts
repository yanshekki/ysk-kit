import type { IncomingMessage } from 'node:http';
import type { Logger } from 'pino';
import pinoHttp from 'pino-http';
import { REQUEST_ID_HEADER } from './request-id';

export const httpLogger = (logger: Logger) =>
  pinoHttp({
    logger,
    genReqId: (req: IncomingMessage) =>
      String(req.headers[REQUEST_ID_HEADER] ?? crypto.randomUUID()),
  });
