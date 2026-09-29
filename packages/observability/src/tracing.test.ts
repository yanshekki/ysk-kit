import { Writable } from 'node:stream';
import { AggregationTemporality, InMemoryMetricExporter } from '@opentelemetry/sdk-metrics';
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { createLogger } from '@ysk/logger';
import { describe, expect, it } from 'vitest';
import { pinoOtelMixin } from './pino-otel-mixin';
import { startOtelFromEnv } from './tracing';

describe('otel traces', () => {
  it('no-ops without an endpoint', async () => {
    const otel = startOtelFromEnv({});
    expect(otel.enabled).toBe(false);
    await otel.shutdown();
  });

  it('records a span with an in-memory exporter', async () => {
    const exporter = new InMemorySpanExporter();
    const otel = startOtelFromEnv({}, { exporter, instrumentHttp: false });
    expect(otel.enabled).toBe(true);
    const span = otel.tracer.startSpan('test');
    span.end();
    await otel.forceFlush();
    const names = exporter.getFinishedSpans().map((item) => item.name);
    expect(names).toContain('test');
    await otel.shutdown();
  });

  it('returns empty pino bindings without an active span', () => {
    expect(pinoOtelMixin()).toEqual({});
  });

  it('copies trace_id and span_id from the active span', async () => {
    const exporter = new InMemorySpanExporter();
    const otel = startOtelFromEnv({}, { exporter, instrumentHttp: false });
    try {
      otel.tracer.startActiveSpan('log', (span) => {
        const ctx = span.spanContext();
        expect(pinoOtelMixin()).toEqual({ trace_id: ctx.traceId, span_id: ctx.spanId });
        span.end();
      });
    } finally {
      await otel.shutdown();
    }
  });

  it('writes mixin fields onto production JSON logs inside a span', async () => {
    const exporter = new InMemorySpanExporter();
    const otel = startOtelFromEnv({}, { exporter, instrumentHttp: false });
    const chunks: Buffer[] = [];
    const destination = new Writable({
      write(chunk, _enc, cb) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
        cb();
      },
    });
    const logger = createLogger({ env: 'production', mixin: pinoOtelMixin, destination });
    try {
      let expected: { trace_id: string; span_id: string } | undefined;
      otel.tracer.startActiveSpan('log', (span) => {
        const ctx = span.spanContext();
        expected = { trace_id: ctx.traceId, span_id: ctx.spanId };
        logger.info('correlated');
        span.end();
      });
      const line = Buffer.concat(chunks).toString().trim().split('\n').at(-1) ?? '';
      const parsed = JSON.parse(line) as { msg: string; trace_id?: string; span_id?: string };
      expect(parsed.msg).toBe('correlated');
      expect(parsed.trace_id).toBe(expected?.trace_id);
      expect(parsed.span_id).toBe(expected?.span_id);
    } finally {
      await otel.shutdown();
    }
  });

  it('uses defaultServiceName when OTEL_SERVICE_NAME is unset', async () => {
    const exporter = new InMemorySpanExporter();
    const otel = startOtelFromEnv(
      {},
      { exporter, instrumentHttp: false, defaultServiceName: 'ysk-worker' },
    );
    try {
      const span = otel.tracer.startSpan('job');
      span.end();
      await otel.forceFlush();
      const [finished] = exporter.getFinishedSpans();
      expect(finished?.resource.attributes[ATTR_SERVICE_NAME]).toBe('ysk-worker');
    } finally {
      await otel.shutdown();
    }
  });

  it('lets OTEL_SERVICE_NAME win over defaultServiceName', async () => {
    const exporter = new InMemorySpanExporter();
    const otel = startOtelFromEnv(
      { OTEL_SERVICE_NAME: 'custom' },
      { exporter, instrumentHttp: false, defaultServiceName: 'ysk-worker' },
    );
    try {
      const span = otel.tracer.startSpan('job');
      span.end();
      await otel.forceFlush();
      const [finished] = exporter.getFinishedSpans();
      expect(finished?.resource.attributes[ATTR_SERVICE_NAME]).toBe('custom');
    } finally {
      await otel.shutdown();
    }
  });

  it('records a counter with an in-memory metric exporter', async () => {
    const metricExporter = new InMemoryMetricExporter(AggregationTemporality.CUMULATIVE);
    const otel = startOtelFromEnv(
      {},
      { metricExporter, instrumentHttp: false, defaultServiceName: 'ysk-worker' },
    );
    try {
      expect(otel.enabled).toBe(true);
      expect(otel.traces).toBe(false);
      expect(otel.metrics).toBe(true);
      otel.meter.createCounter('ysk.test').add(1);
      await otel.forceFlush();
      const names = metricExporter
        .getMetrics()
        .flatMap((row) =>
          row.scopeMetrics.flatMap((scope) => scope.metrics.map((item) => item.descriptor.name)),
        );
      expect(names).toContain('ysk.test');
      expect(metricExporter.getMetrics()[0]?.resource.attributes[ATTR_SERVICE_NAME]).toBe(
        'ysk-worker',
      );
    } finally {
      await otel.shutdown();
    }
  });
});
