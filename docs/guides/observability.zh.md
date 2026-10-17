# 觀測

Language: [English](observability.md) · 中文

YSK Kit 如何記錄失敗。法律：[AGENTS.zh.md](../../AGENTS.zh.md)。Envelope：[envelope](envelope.zh.md)。程序：[error-log-review](../skills/error-log-review.zh.md)。

## 三種訊號，一套分類

| 訊號 | 位置 | 用途 |
|---|---|---|
| 日誌 | stdout 上的 Pino JSON（`@ysk-kit/logger`） | 診斷一筆請求 |
| 指標 | Prometheus `GET /metrics`、`ysk_http_errors_total{code,status}` | 對速率告警 |
| 追蹤 | 可選 OTLP（`OTEL_EXPORTER_OTLP_ENDPOINT`） | 串連 span；Jaeger UI 可選 |

用 envelope `error.code` 當鍵，不要用翻譯過的 `message`。同一個 code 出現在 JSON 錯誤本文、ERROR log 與計數 label。不要用 request path 當指標 label（高 cardinality）。

## API 會記甚麼

HTTP error handler（Express 與 Fastify）在 mapping 後的 envelope 是 `INTERNAL` 或 HTTP status ≥ 500 時呼叫 `logger.error({ err, requestId, code, status })`。預期 4xx `AppError` 與 Zod 422 不打 ERROR；access log 仍記 status。Fastify 5xx access line 用 `logger.error`，id 可能叫 `reqId`。

Job：`withJobSpan` 在 span 上記例外；`registerWorkers` 也寫 `logger.error({ err, job })`。

Pino 會遮罩 authorization、cookies、token、password、OTP 與 API key（`LOG_REDACT_PATHS`）。可選 `LOG_LEVEL` 覆寫預設（production `info`，其餘 `debug`）。

CI **不**啟動 Jaeger、Grafana、Redis 或 OTLP collector。單元測試用 silent 或記憶體 pino。

## 相關性

`x-request-id` 會抄到 envelope 的 `error.requestId`。SDK 在有值時把它接到 `AppError.requestId`（沒有就省略該鍵）。登入 `ErrorBanner` 可以顯示它作支援引用。Stack 留在伺服器日誌。

開啟 OTel 時，`pinoOtelMixin` 加上 `trace_id`／`span_id`。Compose：[部署](deploy.zh.md)。Prometheus 刮取 `/metrics` 後，Grafana dashboard `ysk-api` 含 5xx 速率與按 code 的錯誤。

## 不要在 kit 內建造

- Prisma `ErrorLog` 或 admin 錯誤收件箱（audit 仍是領域事件）。
- Sentry／Datadog／Loki 作為預設。產品可以把日誌送到 vendor；kit 保證 JSON + `error.code`。
- 客戶端 import `@ysk-kit/logger` 或 `@ysk-kit/observability`。
