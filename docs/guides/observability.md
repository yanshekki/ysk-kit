# Observability

Language: [中文](observability.zh.md) · English

How YSK Kit records failures. Law: [AGENTS.md](../../AGENTS.md). Envelope: [envelope](envelope.md). Procedure: [error-log-review](../skills/error-log-review.md).

## Three signals, one taxonomy

| Signal | Where | Use |
|---|---|---|
| Logs | Pino JSON on stdout (`@ysk-kit/logger`) | Diagnose one request |
| Metrics | Prometheus `GET /metrics`, `ysk_http_errors_total{code,status}` | Alert on rate |
| Traces | Optional OTLP (`OTEL_EXPORTER_OTLP_ENDPOINT`) | Correlate spans; Jaeger UI is opt-in |

Key off envelope `error.code`, not a translated `message`. The same code appears on the JSON error body, the ERROR log, and the counter labels. Do not label metrics with request path (high cardinality).

## What the API logs

HTTP error handlers (Express and Fastify) call `logger.error({ err, requestId, code, status })` when the mapped envelope is `INTERNAL` or HTTP status ≥ 500. Expected 4xx `AppError` and Zod 422 stay off ERROR; the access log still records status. Fastify 5xx access lines use `logger.error` and may name the id `reqId`.

Jobs: `withJobSpan` records the exception on the span; `registerWorkers` also writes `logger.error({ err, job })`.

Pino redacts authorization, cookies, tokens, passwords, OTP, and API keys (`LOG_REDACT_PATHS`). Optional `LOG_LEVEL` overrides the default (production `info`, otherwise `debug`).

CI does **not** start Jaeger, Grafana, Redis, or an OTLP collector. Unit tests use silent or in-memory pino.

## Correlation

`x-request-id` is copied onto the envelope `error.requestId`. The SDK attaches it to `AppError.requestId` when present (the key is omitted when absent). Login `ErrorBanner` may show it as a support reference. Stacks stay on the server log.

When OTel is on, `pinoOtelMixin` adds `trace_id` / `span_id`. Compose: [deploy](deploy.md). Grafana dashboard `ysk-api` includes 5xx rate and errors by code once Prometheus scrapes `/metrics`.

## What not to build in the kit

- Prisma `ErrorLog` or an admin error inbox (audit stays domain events).
- Sentry / Datadog / Loki as a default. A product may ship logs to a vendor; the kit guarantees JSON + `error.code`.
- Client imports of `@ysk-kit/logger` or `@ysk-kit/observability`.
