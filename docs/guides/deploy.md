# Deploy

Language: [中文](deploy.zh.md) · English

## Docker Compose (local and single host)

`docker-compose.yml` in this repository:

| Service | Image | Ports |
|---|---|---|
| mysql | `mysql:8.4` | 3306 |
| redis | `redis:8.10-alpine` | 6379 |
| jaeger | `jaegertracing/jaeger:2.21.0` | 16686 UI, 4318 OTLP HTTP |
| prometheus | `prom/prometheus:v3.15.0` | 9090 |
| grafana | `grafana/grafana:13.2.3` | 3000 (`admin` / `admin`) |

Start only what you need. `docker compose up -d mysql` is enough for the API. Redis is required for multi-process Socket.IO and durable BullMQ. Jaeger / Prometheus / Grafana are opt-in UIs.

Generated products with `--db postgresql` get `postgres:18-alpine`. `--db sqlite` does not start a database container. `static-web3` writes a comment Compose file.

## Process model

Two Node processes in production:

| Process | Entry | Env |
|---|---|---|
| API | `apps/api/dist/main.js` | `RUN_WORKERS=0` |
| Worker | `apps/api/dist/worker.js` | consumes BullMQ / memory queue |

```bash
pnpm --filter @ysk-kit/api build
pm2 start ecosystem.config.cjs
```

`ecosystem.config.cjs` loads `.env` with `node --env-file=.env`. API `instances` stays `1` unless `REDIS_URL` is set (Socket.IO Redis adapter). Raise forks only with Redis.

Development may set `RUN_WORKERS=1` so the API process also runs workers.

## Adapter switches

| Variable | Effect |
|---|---|
| `HTTP_ADAPTER=fastify` | Same contracts on Fastify 5 |
| `REDIS_URL` | BullMQ + Socket.IO Redis adapter + worker emitter |
| `SMTP_URL` | Real mail instead of log adapter |
| `S3_*` | S3-compatible storage instead of local files |
| `STRIPE_SECRET_KEY` + `STRIPE_PRICE_PRO` | Stripe Checkout instead of log billing |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Traces |

Environment catalogue: [env](../cli/env.md).
