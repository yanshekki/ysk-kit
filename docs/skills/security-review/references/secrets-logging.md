# Secrets and logging

Language: [中文](secrets-logging.zh.md) · English

Parent: [security-review](../../security-review.md). Also getsentry `secret-serialization` and pino redaction.

## Never log or commit

OTP codes, JWT access/refresh tokens, `JWT_SECRET`, Stripe `sk_` / `rk_`, `STRIPE_WEBHOOK_SECRET` (`whsec_`), webhook payloads that embed PANs or secrets, `CRYPTO_MASTER_KEY`, FCM private keys, SMTP passwords, `S3_SECRET_KEY`.

AGENTS.md “Do not log secrets” still applies: redaction is a backstop, not permission to pass OTP, `sk_`, or `whsec_` into a log.

## Right pattern

`@ysk-kit/logger` already passes pino `redact` paths (`LOG_REDACT_PATHS`): authorization, cookies, tokens, passwords, OTP, webhook secrets, and common API-key env names, with `censor: '[Redacted]'`. New log sites must still omit those fields. Do not `JSON.stringify` an env object or a Stripe event into a span. `ysk-kit check logs` fails on `sk_live` / `sk_test` / `whsec_` / OTP literals.

`assertProductionSecrets` in `@ysk-kit/config` refuses `change-me-in-dev-only` and short JWT secrets when `NODE_ENV=production`. Do not weaken it.

## Envelope errors

`{ ok: false, error: { code, message, details?, requestId? } }`. `details` is client-visible. Do not put SQL, stack traces, or secret names there. Internals stay on the logger with a `requestId`.

## Env

Secrets live in `.env` (gitignored). `.env.example` lists keys, not live values. `pnpm ysk-kit doctor` warns on missing/weak secrets.

## Checks

```bash
pnpm ysk-kit check errors
pnpm ysk-kit check logs --file <jsonl>
rg -n "console\\.log|logger\\.(info|debug)\\(" apps/api/src packages/logger packages/observability
```

Read each hit. Fail the review if a token, OTP, or `sk_` can reach the sink.

## Privacy

Hong Kong PDPO breach notification is still a PCPD **recommendation** as of 2026-10 (not a skill-level legal opinion). Inventory PII in the plan: what leaves the API toward Stripe, LLM providers, S3, or Expo Push.
