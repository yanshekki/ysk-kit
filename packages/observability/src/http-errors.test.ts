import { describe, expect, it } from 'vitest';
import { createHttpErrorCounter } from './http-errors.js';
import { createMetricsRegistry } from './index.js';

describe('createHttpErrorCounter', () => {
  it('increments ysk_http_errors_total by code and status', async () => {
    const register = createMetricsRegistry();
    const record = createHttpErrorCounter(register);
    record({ code: 'INTERNAL', status: 500 });
    record({ code: 'INTERNAL', status: 500 });
    record({ code: 'INTERNAL', status: 503 });
    const body = await register.metrics();
    expect(body).toContain('ysk_http_errors_total');
    expect(body).toMatch(/ysk_http_errors_total\{code="INTERNAL",status="500"\} 2/);
    expect(body).toMatch(/ysk_http_errors_total\{code="INTERNAL",status="503"\} 1/);
  });
});
