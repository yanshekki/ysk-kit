import type { IncomingMessage } from 'node:http';
import type { Logger } from 'pino';
import pinoHttpMod from 'pino-http';
import { REQUEST_ID_HEADER } from './request-id.js';

const pinoHttp = pinoHttpMod as unknown as (opts: {
  logger: Logger;
  genReqId: (req: IncomingMessage) => string;
}) => (req: IncomingMessage, res: unknown, next?: () => void) => void;

export const httpLogger = (logger: Logger) =>
  pinoHttp({
    logger,
    genReqId: (req: IncomingMessage) =>
      String(req.headers[REQUEST_ID_HEADER] ?? crypto.randomUUID()),
  });
