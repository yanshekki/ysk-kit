# Secrets and logging

Language: [中文](secrets-logging.zh.md) · English

Parent: [security-review](../../security-review.md). Also getsentry `secret-serialization` and pino redaction.

## Never log or commit

OTP codes, JWT access/refresh tokens, `JWT_SECRET`, Stripe `sk_` / `rk_`, `STRIPE_WEBHOOK_SECRET` (`whsec_`), webhook payloads that embed PANs or secrets, `CRYPTO_MASTER_KEY`, FCM private keys, SMTP passwords, `S3_SECRET_KEY`.

AGENTS.md hard rule 4 (clients) and “Do not log secrets” apply even when the logger has no redact list.

## Right pattern

`packages/logger` should pass pino `redact` paths, for example:

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

The kit logger does **not** ship this yet. New log sites must still omit those fields. Do not `JSON.stringify` an env object or a Stripe event into a span.

`assertProductionSecrets` in `@ysk-kit/config` refuses `change-me-in-dev-only` and short JWT secrets when `NODE_ENV=production`. Do not weaken it.

## Envelope errors

`{ ok: false, error: { code, message, details?, requestId? } }`. `details` is client-visible. Do not put SQL, stack traces, or secret names there. Internals stay on the logger with a `requestId`.

## Env

Secrets live in `.env` (gitignored). `.env.example` lists keys, not live values. `pnpm ysk-kit doctor` warns on missing/weak secrets.

## Checks

```bash
rg -n "console\\.log|logger\\.(info|debug)\\(" apps/api/src packages/logger packages/observability
```

Read each hit. Fail the review if a token, OTP, or `sk_` can reach the sink.

## Privacy

Hong Kong PDPO breach notification is still a PCPD **recommendation** as of 2026-10 (not a skill-level legal opinion). Inventory PII in the plan: what leaves the API toward Stripe, LLM providers, S3, or Expo Push.
