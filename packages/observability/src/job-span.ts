import { SpanStatusCode, type Tracer, trace } from '@opentelemetry/api';

export const withJobSpan = async <T>(
  name: string,
  fn: () => Promise<T>,
  tracer: Tracer = trace.getTracer('ysk'),
): Promise<T> => {
  return tracer.startActiveSpan(name, { attributes: { 'job.name': name } }, async (span) => {
    try {
      return await fn();
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
};
