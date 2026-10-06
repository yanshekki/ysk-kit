# 密鑰與日誌

Language: [English](secrets-logging.md) · 中文

上層：[安全審查](../../security-review.zh.md)。亦見 getsentry `secret-serialization` 與 pino redaction。

## 不要寫進日誌或 commit

OTP 代碼、JWT access／refresh token、`JWT_SECRET`、Stripe `sk_`／`rk_`、`STRIPE_WEBHOOK_SECRET`（`whsec_`）、內含 PAN 或密鑰的 webhook payload、`CRYPTO_MASTER_KEY`、FCM private key、SMTP 密碼、`S3_SECRET_KEY`。

即使 logger 沒有 redact 清單，AGENTS.md 的「不要 log 密鑰」仍然適用。

## 正確模式

`packages/logger` 應該傳入 pino `redact` paths，例如：

```ts
redact: {
  paths: [
    'req.headers.authorization',
    'password',
    'passwordHash',
    'token',
    'refreshToken',
    'otp',
    'secret',
    '*.secretKey',
    '*.webhookSecret',
  ],
  censor: '[Redacted]',
}
```

Kit logger **尚未**內建這份清單。新的 log 點仍須省略那些欄位。不要把 env 物件或 Stripe event `JSON.stringify` 進 span。

`@ysk-kit/config` 的 `assertProductionSecrets` 在 `NODE_ENV=production` 時拒絕 `change-me-in-dev-only` 與過短的 JWT secret。不要削弱它。

## Envelope 錯誤

`{ ok: false, error: { code, message, details?, requestId? } }`。`details` 對客戶端可見。不要把 SQL、stack 或密鑰名稱放進去。內部細節留在帶 `requestId` 的 logger。

## 環境變數

密鑰放在 `.env`（已 gitignore）。`.env.example` 列鍵名，不是現場值。`pnpm ysk-kit doctor` 會對缺失／過弱密鑰提出警告。

## 檢查

```bash
rg -n "console\\.log|logger\\.(info|debug)\\(" apps/api/src packages/logger packages/observability
```

逐筆閱讀。若 token、OTP 或 `sk_` 能到達 sink，審查失敗。

## 私隱

截至 2026-10，香港 PDPO 的資料外洩通報仍是 PCPD **建議**（不是 skill 層的法律意見）。在計劃盤點 PII：有哪些資料會從 API 流向 Stripe、LLM 供應商、S3 或 Expo Push。
