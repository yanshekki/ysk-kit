import { context, trace } from '@opentelemetry/api';

export const pinoOtelMixin = (): { trace_id: string; span_id: string } | Record<string, never> => {
  const span = trace.getSpan(context.active());
  if (!span) return {};
  const spanContext = span.spanContext();
  if (!trace.isSpanContextValid(spanContext)) return {};
  return { trace_id: spanContext.traceId, span_id: spanContext.spanId };
};
