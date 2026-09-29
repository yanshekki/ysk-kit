export { withJobSpan } from './job-span';
export { pinoOtelMixin } from './pino-otel-mixin';
export { getTracer, type OtelEnv, type OtelHandle, startOtelFromEnv } from './tracing';

import type { Express } from 'express';
import { collectDefaultMetrics, Registry } from 'prom-client';

export type { Registry };

export const createMetricsRegistry = (): Registry => {
  const register = new Registry();
  collectDefaultMetrics({ register });
  return register;
};

export const mountMetrics = (app: Express, register: Registry): void => {
  app.get('/metrics', async (_req, res, next) => {
    try {
      res.setHeader('content-type', register.contentType);
      res.status(200).send(await register.metrics());
    } catch (error) {
      next(error);
    }
  });
};
