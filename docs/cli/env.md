# Environment variables

Language: [中文](env.zh.md) · English

Aligned with `.env.example`. Copy to `.env` for local runs. Never commit secrets. Empty values mean “adapter off / log adapter / skip”.

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development` / `production`. Production seed requires `ALLOW_SEED=1`. Production OTP requires `TWILIO_*`. Production crypto requires `CRYPTO_MASTER_KEY`. |
| `API_PORT` | HTTP listen port (default 3001). |
| `API_PUBLIC_URL` | Absolute API URL for clients and OpenAPI. |
| `WEB_PUBLIC_URL` | Web origin; password-reset and invite links. |
| `ADMIN_PUBLIC_URL` | Admin origin. |
| `DATABASE_URL` | Prisma connection string. |
| `JWT_SECRET` | Access-token HMAC secret. |
| `JWT_ACCESS_TTL` | Access-token lifetime (default `15m`). |
| `OTP_TTL_SECONDS` | Phone/admin OTP lifetime (default 300). |
| `REDIS_URL` | BullMQ + Socket.IO Redis adapter. Empty → in-memory queue and in-process realtime. |
| `SMTP_URL` | Nodemailer transport. Empty → log mail adapter. |
| `MAIL_FROM` | From address (default `ysk-kit@localhost`). |
| `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_REGION` | S3-compatible storage. Incomplete set → local files. |
| `RUN_WORKERS` | `1` starts workers inside the API process. PM2 API sets `0`. |
| `LLM_BASE_URL` | OpenAI-compatible base (default `https://api.x.ai/v1`). |
| `LLM_API_KEY` / `XAI_API_KEY` | LLM secret. Missing outside production → fake `pong` model. Missing in production → 503. |
| `LLM_MODEL` | Default `grok-4.7`. |
| `HTTP_ADAPTER` | `express` (default) or `fastify`. |
| `CRYPTO_MASTER_KEY` | 64 hex chars for AES-256-GCM. |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | SMS OTP. All three required in production. |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Traces. Empty → OTel traces off. Jaeger OTLP HTTP is `http://localhost:4318`. |
| `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` | Metrics. Do not reuse the traces URL for Jaeger (traces only). |
| `OTEL_SERVICE_NAME` | Override; API defaults `ysk-api`, worker `ysk-worker`. |
| `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO` | Enable Stripe Checkout. Log billing adapter is the default without them. |
| `STRIPE_WEBHOOK_SECRET` | `POST /v1/billing/webhook`. Missing → 404. |
| `RATE_LIMIT_MAX` | Requests per window per IP. `0` disables. Default 300. Skips `/health` `/ready` `/metrics`. |
| `RATE_LIMIT_WINDOW_MS` | Window (default 60000). |
| `EXPO_ACCESS_TOKEN` | Expo Push API. |
| `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY` | FCM HTTP v1 for non-Expo tokens. Incomplete set → log adapter. |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Seed admin (defaults `admin@ysk.hk` / `ysk-admin-dev`). |
| `SEED_USER_EMAIL`, `SEED_USER_PASSWORD` | Seed user (defaults `user@ysk.hk` / `ysk-user-dev`). |
| `ALLOW_SEED` | Production seed gate. Set `1` to allow. |

`YSK_ROOT` is a process env for the `ysk` CLI, not an application secret.
