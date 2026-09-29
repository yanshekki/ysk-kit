import { SpanStatusCode } from '@opentelemetry/api';
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base';
import { describe, expect, it } from 'vitest';
import { withJobSpan } from './job-span';
import { pinoOtelMixin } from './pino-otel-mixin';
import { startOtelFromEnv } from './tracing';

describe('withJobSpan', () => {
  it('records a span named after the job', async () => {
    const exporter = new InMemorySpanExporter();
    const otel = startOtelFromEnv({}, { exporter, instrumentHttp: false });
    let ran = false;
    try {
      await withJobSpan(
        'email.send',
        async () => {
          ran = true;
        },
        otel.tracer,
      );
      await otel.forceFlush();
      const [finished] = exporter.getFinishedSpans();
      expect(ran).toBe(true);
      expect(finished?.name).toBe('email.send');
      expect(finished?.attributes['job.name']).toBe('email.send');
      expect(finished?.status.code).toBe(SpanStatusCode.UNSET);
    } finally {
      await otel.shutdown();
    }
  });

  it('marks ERROR and rethrows when the handler throws', async () => {
    const exporter = new InMemorySpanExporter();
    const otel = startOtelFromEnv({}, { exporter, instrumentHttp: false });
    try {
      await expect(
        withJobSpan(
          'push.send',
          async () => {
            throw new Error('boom');
          },
          otel.tracer,
        ),
      ).rejects.toThrow('boom');
      await otel.forceFlush();
      const [finished] = exporter.getFinishedSpans();
      expect(finished?.name).toBe('push.send');
      expect(finished?.status.code).toBe(SpanStatusCode.ERROR);
      expect(finished?.events.some((event) => event.name === 'exception')).toBe(true);
    } finally {
      await otel.shutdown();
    }
  });

  it('activates a valid span for pinoOtelMixin', async () => {
    const exporter = new InMemorySpanExporter();
    const otel = startOtelFromEnv({}, { exporter, instrumentHttp: false });
    try {
      let bindings: { trace_id: string; span_id: string } | Record<string, never> = {};
      await withJobSpan(
        'notification.create',
        async () => {
          bindings = pinoOtelMixin();
        },
        otel.tracer,
      );
      expect(bindings.trace_id).toMatch(/^[0-9a-f]{32}$/);
      expect(bindings.span_id).toMatch(/^[0-9a-f]{16}$/);
    } finally {
      await otel.shutdown();
    }
  });
});
