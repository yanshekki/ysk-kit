# 環境變數

Language: [English](env.md) · 中文

與 `.env.example` 對齊。本機運行請複製到 `.env`。不要把密鑰提交進倉。空白值代表「adapter 關閉／日誌 adapter／略過」。

| 變數 | 用途 |
|---|---|
| `NODE_ENV` | `development` / `production`。生產環境種子需要 `ALLOW_SEED=1`。生產環境 OTP 需要 `TWILIO_*`。生產環境加密需要 `CRYPTO_MASTER_KEY`。生產環境 `JWT_SECRET` 至少 32 個字元，而且不可以是 `change-me-in-dev-only`。 |
| `API_PORT` | HTTP 監聽埠（預設 3001）。 |
| `API_PUBLIC_URL` | 客戶端與 OpenAPI 使用的絕對 API 網址。 |
| `WEB_PUBLIC_URL` | Web origin；重設密碼與邀請連結。 |
| `ADMIN_PUBLIC_URL` | Admin origin。 |
| `DATABASE_URL` | Prisma 連線字串。 |
| `JWT_SECRET` | Access token 的 HMAC 密鑰。開發環境至少 8 個字元。生產環境至少 32 個字元，並拒絕 `change-me-in-dev-only`。 |
| `JWT_ACCESS_TTL` | Access token 有效期（預設 `15m`）。 |
| `OTP_TTL_SECONDS` | 電話／admin OTP 有效期（預設 300）。 |
| `REDIS_URL` | BullMQ、Socket.IO Redis adapter，以及共用的 IP 速率視窗。空白 → 記憶體佇列、行程內即時通訊，以及每個行程自己的速率限制。 |
| `SMTP_URL` | Nodemailer 傳輸。空白 → 日誌郵件 adapter。 |
| `MAIL_FROM` | 寄件地址（預設 `ysk-kit@localhost`）。 |
| `S3_ENDPOINT`、`S3_BUCKET`、`S3_ACCESS_KEY`、`S3_SECRET_KEY`、`S3_REGION` | S3 相容儲存。未齊 → 本地檔案。 |
| `RUN_WORKERS` | `1` 在 API 行程內啟動 worker。PM2 API 設為 `0`。 |
| `LLM_BASE_URL` | OpenAI 相容基底（預設 `https://api.x.ai/v1`）。 |
| `LLM_API_KEY` / `XAI_API_KEY` | LLM 密鑰。非生產環境缺失 → 假 `pong` 模型。生產環境缺失 → 503。 |
| `LLM_MODEL` | 預設 `grok-4.7`。 |
| `HTTP_ADAPTER` | `express`（預設）或 `fastify`。 |
| `CRYPTO_MASTER_KEY` | AES-256-GCM 用的 64 個十六進位字元。 |
| `TWILIO_ACCOUNT_SID`、`TWILIO_AUTH_TOKEN`、`TWILIO_FROM` | SMS OTP。生產環境三者皆須。 |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Traces。空白 → 關閉 OTel traces。Jaeger OTLP HTTP 為 `http://localhost:4318`。 |
| `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` | Metrics。不要把 traces 網址重用於 Jaeger（只支援 traces）。 |
| `OTEL_SERVICE_NAME` | 覆寫；API 預設 `ysk-api`，worker 預設 `ysk-worker`。 |
| `STRIPE_SECRET_KEY`、`STRIPE_PRICE_PRO` | 啟用 Stripe Checkout。未設時預設日誌 billing adapter。 |
| `STRIPE_WEBHOOK_SECRET` | `POST /v1/billing/webhook`。缺失 → 404。 |
| `RATE_LIMIT_MAX` | 每個 IP 在視窗內的請求數。`0` 關閉。預設 300。略過 `/health` `/ready` `/metrics`。未設 `REDIS_URL` 時每個行程用記憶體；設了之後多個 API 行程共用同一個 Redis 固定視窗。 |
| `RATE_LIMIT_WINDOW_MS` | 視窗（預設 60000）。 |
| `EXPO_ACCESS_TOKEN` | Expo Push API。 |
| `FCM_PROJECT_ID`、`FCM_CLIENT_EMAIL`、`FCM_PRIVATE_KEY` | 非 Expo 權杖的 FCM HTTP v1。未齊 → 日誌 adapter。 |
| `SEED_ADMIN_EMAIL`、`SEED_ADMIN_PASSWORD` | 種子 admin（預設 `admin@ysk.hk` / `ysk-admin-dev`）。 |
| `SEED_USER_EMAIL`、`SEED_USER_PASSWORD` | 種子 user（預設 `user@ysk.hk` / `ysk-user-dev`）。 |
| `ALLOW_SEED` | 生產環境種子閘。設為 `1` 才允許。 |

`YSK_ROOT` 是 `ysk` CLI 的行程環境變數，不是應用密鑰。
