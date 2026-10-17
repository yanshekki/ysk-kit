---
name: error-log-review
description: >
  Review YSK Kit error logs with envelope error.code, requestId, and structured Pino JSON.
  Use when INTERNAL/5xx, a log dump, secret-in-log, or /error-log-review.
  中文：錯誤日誌、requestId、check logs、INTERNAL。
  Do not use for green-field features (plan-feature) or a red Vitest without logs (debug-issue).
---

# Skill: review error logs

Language: [中文](error-log-review.zh.md) · English

Turn a captured error log into a typed `AppError` and a red test. Law: [AGENTS.md](../../AGENTS.md). Downstream loop: [debug-issue](debug-issue.md). Secrets: [security-review](security-review.md). Guide: [observability](../guides/observability.md). Recipe: [review-error-logs](../recipes/review-error-logs.md).

## Trigger

- Production or staging `INTERNAL` / HTTP 5xx.
- A JSON log dump, Grafana 5xx panel, or Jaeger span with an exception.
- `ysk-kit check logs` reported a secret leak or missing `requestId`.

Do not use to design a new resource ([plan-feature](plan-feature.md)) or when you already have a red Vitest ([debug-issue](debug-issue.md)).

## Inputs

| Input | Required | Notes |
|---|---|---|
| Log excerpt or JSONL | yes | Production JSON (`NODE_ENV=production`), not pino-pretty |
| Time window | yes | Correlate with deploy / config |
| `requestId` | as soon as you have one | Envelope and ERROR log share it |

## Classify first

| Class | Meaning | Next |
|---|---|---|
| Secret in a log (`sk_`, `whsec_`, OTP literal) | P0 security | Rotate; do not paste the secret; follow [secrets-logging](security-review/references/secrets-logging.md) |
| `INTERNAL` / status ≥ 500 | Bug until mapped | Exemplar `requestId` → red test |
| 4xx spike | Product rule or client bug | Do not raise log level to ERROR |
| Expected 4xx `AppError` | Validation / authz / missing row | Access log only; no ERROR line |

ERROR level means someone must act. Expected 4xx stays silent on purpose.

## Steps

1. Run `pnpm ysk-kit check logs --file <jsonl>` (or stdin). Note INTERNAL count and findings.
2. Pick **1–3 exemplars**. Prefer `requestId` (Fastify access lines may use `reqId`). If `trace_id` is present and Jaeger is running, open that trace. Do not grep forever.
3. Write 3–5 hypotheses (same table shape as [debug-issue](debug-issue.md)). Typical: missing `AppError` in `application/`; infra throw; Fastify register omitted; envelope unwrap.
4. Hand off to [debug-issue](debug-issue.md): memory-port red test, then HTTP on Express **and** Fastify asserting `error.code` and `error.requestId`.
5. Fix in `application/` (map to `AppError`) or the adapter. Do not log secrets “to see the leak”.
6. Recapture. That class of INTERNAL should be gone. `pnpm ysk-kit check errors` stays green.

Do not start Redis, Stripe, Twilio, FCM, Jaeger, or Grafana for the unit test. Jaeger is opt-in only for the human correlation step.

## Verification

```bash
pnpm ysk-kit check logs --file <jsonl>
pnpm ysk-kit check errors
pnpm --filter @ysk-kit/api exec vitest run <file> -t '<name>'
```

- [ ] Classification named (secret / INTERNAL / 4xx)
- [ ] Exemplar `requestId` recorded
- [ ] Red test existed before the fix
- [ ] No secret in the write-up or new logs

## Output format

```md
## Error log — <symptom>
Class: secret | INTERNAL | 4xx-spike | expected-4xx
Exemplars: requestId=… (trace_id=… optional)
check logs: ok | findings
Hypotheses: 3–5 rows
Red test: <file> / <it name>
Fix: <files>
Secrets: none logged
```

## Done criteria

The INTERNAL class has a kept regression, both HTTP adapters assert the envelope, `check errors` is ok, and the write-up is blameless (missing mapping or infra failure — not a person).

## Anti-patterns

| Symptom | Do this instead |
|---|---|
| Admin “error inbox” / Prisma `ErrorLog` | stdout JSON + `check logs`; audit stays domain events |
| `logger.error` on every 4xx | Access log; ERROR is INTERNAL / 5xx only |
| Log OTP / `sk_` to debug | Assert `error.code` + `requestId` |
| Grep the whole file | 1–3 exemplars |
| Sentry as kit default | Product choice; kit guarantees JSON + `error.code` |

## Escalate / ask

Ask before adding an envelope exception, inventing a capability for error tracking, or shipping stacks in `error.details`.
