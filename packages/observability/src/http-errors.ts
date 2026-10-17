import { Counter, type Registry } from 'prom-client';

export type HttpErrorLabels = { code: string; status: number };

export const createHttpErrorCounter = (register: Registry): ((input: HttpErrorLabels) => void) => {
  const counter = new Counter({
    name: 'ysk_http_errors_total',
    help: 'HTTP envelope errors logged at ERROR (INTERNAL or status >= 500)',
    labelNames: ['code', 'status'] as const,
    registers: [register],
  });
  return ({ code, status }) => {
    counter.inc({ code, status: String(status) });
  };
};
