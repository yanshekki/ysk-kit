import { type Meter, metrics, trace } from '@opentelemetry/api';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  MeterProvider,
  PeriodicExportingMetricReader,
  type PushMetricExporter,
} from '@opentelemetry/sdk-metrics';
import {
  BatchSpanProcessor,
  SimpleSpanProcessor,
  type SpanExporter,
} from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

export type OtelHandle = {
  enabled: boolean;
  traces: boolean;
  metrics: boolean;
  shutdown: () => Promise<void>;
  forceFlush: () => Promise<void>;
  tracer: ReturnType<typeof trace.getTracer>;
  meter: Meter;
};

export type OtelEnv = {
  OTEL_EXPORTER_OTLP_ENDPOINT?: string | undefined;
  OTEL_EXPORTER_OTLP_METRICS_ENDPOINT?: string | undefined;
  OTEL_SERVICE_NAME?: string | undefined;
};

const tracesUrl = (endpoint: string): string => {
  const base = endpoint.replace(/\/$/, '');
  return base.endsWith('/v1/traces') ? base : `${base}/v1/traces`;
};

const metricsUrl = (endpoint: string): string => {
  const base = endpoint.replace(/\/$/, '');
  return base.endsWith('/v1/metrics') ? base : `${base}/v1/metrics`;
};

export const startOtelFromEnv = (
  env: OtelEnv,
  opts?: {
    exporter?: SpanExporter;
    metricExporter?: PushMetricExporter;
    instrumentHttp?: boolean;
    defaultServiceName?: string;
  },
): OtelHandle => {
  const tracesEndpoint = env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const metricsEndpoint = env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT;
  const traceExporter =
    opts?.exporter ??
    (tracesEndpoint ? new OTLPTraceExporter({ url: tracesUrl(tracesEndpoint) }) : undefined);
  const metricExporter =
    opts?.metricExporter ??
    (metricsEndpoint ? new OTLPMetricExporter({ url: metricsUrl(metricsEndpoint) }) : undefined);
  const noop = {
    enabled: false,
    traces: false,
    metrics: false,
    shutdown: async () => undefined,
    forceFlush: async () => undefined,
    tracer: trace.getTracer('ysk'),
    meter: metrics.getMeter('ysk'),
  };
  if (!traceExporter && !metricExporter) return noop;

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: env.OTEL_SERVICE_NAME ?? opts?.defaultServiceName ?? 'ysk-api',
  });

  let tracerProvider: NodeTracerProvider | undefined;
  if (traceExporter) {
    tracerProvider = new NodeTracerProvider({
      resource,
      spanProcessors: [
        opts?.exporter
          ? new SimpleSpanProcessor(traceExporter)
          : new BatchSpanProcessor(traceExporter),
      ],
    });
    tracerProvider.register();
    if (opts?.instrumentHttp ?? Boolean(tracesEndpoint)) {
      registerInstrumentations({ instrumentations: [new HttpInstrumentation()] });
    }
  }

  let meterProvider: MeterProvider | undefined;
  if (metricExporter) {
    meterProvider = new MeterProvider({
      resource,
      readers: [new PeriodicExportingMetricReader({ exporter: metricExporter })],
    });
    metrics.setGlobalMeterProvider(meterProvider);
  }

  return {
    enabled: true,
    traces: Boolean(traceExporter),
    metrics: Boolean(metricExporter),
    forceFlush: async () => {
      await tracerProvider?.forceFlush();
      await meterProvider?.forceFlush();
    },
    shutdown: async () => {
      await tracerProvider?.forceFlush();
      await meterProvider?.forceFlush();
      await tracerProvider?.shutdown();
      await meterProvider?.shutdown();
    },
    tracer: tracerProvider ? tracerProvider.getTracer('ysk') : trace.getTracer('ysk'),
    meter: meterProvider ? meterProvider.getMeter('ysk') : metrics.getMeter('ysk'),
  };
};

export const getTracer = (name = 'ysk') => trace.getTracer(name);
