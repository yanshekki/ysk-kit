import { REQUEST_ID_HEADER } from '@ysk/api-http';
import type { RequestHandler } from 'express';

export { REQUEST_ID_HEADER };

export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.header(REQUEST_ID_HEADER);
  const id = incoming && incoming.length > 0 ? incoming : crypto.randomUUID();
  req.headers[REQUEST_ID_HEADER] = id;
  res.setHeader(REQUEST_ID_HEADER, id);
  next();
};

export const readRequestId = (req: { headers: Record<string, unknown> }): string =>
  String(req.headers[REQUEST_ID_HEADER] ?? crypto.randomUUID());
