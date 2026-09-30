# 部署

Language: [English](deploy.md) · 中文

## Docker Compose（本機與單機）

本倉的 `docker-compose.yml`：

| 服務 | 映像 | 埠 |
|---|---|---|
| mysql | `mysql:8.4` | 3306 |
| redis | `redis:8.10-alpine` | 6379 |
| jaeger | `jaegertracing/jaeger:2.21.0` | 16686 UI、4318 OTLP HTTP |
| prometheus | `prom/prometheus:v3.15.0` | 9090 |
| grafana | `grafana/grafana:13.2.3` | 3000（`admin` / `admin`） |

只啟動你需要的服務。API 只需 `docker compose up -d mysql`。多行程 Socket.IO 與持久 BullMQ 需要 Redis。Jaeger／Prometheus／Grafana 是可選介面。

`--db postgresql` 產生的產品會用 `postgres:18-alpine`。`--db sqlite` 不啟動資料庫容器。`static-web3` 寫出註解式 Compose 檔。

## 行程模型

生產環境兩個 Node 行程：

| 行程 | 入口 | 環境 |
|---|---|---|
| API | `apps/api/dist/main.js` | `RUN_WORKERS=0` |
| Worker | `apps/api/dist/worker.js` | 消費 BullMQ／記憶體佇列 |

```bash
pnpm --filter @ysk-kit/api build
pm2 start ecosystem.config.cjs
```

`ecosystem.config.cjs` 以 `node --env-file=.env` 載入 `.env`。未設 `REDIS_URL` 時，API `instances` 維持 `1`（Socket.IO Redis adapter）。只在有 Redis 時增加 fork。

開發環境可設 `RUN_WORKERS=1`，讓 API 行程同時跑 worker。

## Adapter 開關

| 變數 | 作用 |
|---|---|
| `HTTP_ADAPTER=fastify` | 同一套合約跑在 Fastify 5 |
| `REDIS_URL` | BullMQ + Socket.IO Redis adapter + worker emitter |
| `SMTP_URL` | 真實郵件，取代日誌 adapter |
| `S3_*` | S3 相容儲存，取代本地檔案 |
| `STRIPE_SECRET_KEY` + `STRIPE_PRICE_PRO` | Stripe Checkout，取代日誌 billing |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Traces |

環境變數目錄：[env](../cli/env.zh.md)。
