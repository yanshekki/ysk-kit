---
name: error-log-review
description: >
  Review YSK Kit error logs with envelope error.code, requestId, and structured Pino JSON.
  Use when INTERNAL/5xx, a log dump, secret-in-log, or /error-log-review.
  中文：錯誤日誌、requestId、check logs、INTERNAL。
  Do not use for green-field features (plan-feature) or a red Vitest without logs (debug-issue).
---

Read `docs/skills/error-log-review.md`. Law: `AGENTS.md`.

1. Classify: secret leak > INTERNAL/5xx > 4xx spike > expected 4xx. Run `pnpm ysk-kit check logs --file <jsonl>`.
2. Pick 1–3 exemplar `requestId` values (optional `trace_id` in Jaeger). Write 3–5 hypotheses.
3. Hand off to debug-issue: red memory-port test, then Express and Fastify envelope assertions. Map to `AppError` in `application/`.
Gotcha: do not log OTP/sk_/whsec_. Do not store stacks in Prisma or an admin inbox.
Verify: named Vitest green, `ysk-kit check errors: ok`.
Full steps: `docs/skills/error-log-review.md`.
