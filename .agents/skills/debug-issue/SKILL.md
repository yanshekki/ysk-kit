---
name: debug-issue
description: >
  Debug a YSK Kit failure by building a red feedback loop first: memory-port
  tests, then HTTP on Express AND Fastify, then SDK, then e2e, then git bisect.
  Use when a test, CI job, or user report is red; a flake; or /debug-issue.
  中文：除錯、紅燈迴圈、回歸測試、bisect、日誌遮罩。
  Do not use for green-field features (plan-feature), a JSON INTERNAL dump (error-log-review), a security audit (security-review), or CVE inventory (supply-scan).
---

Read `docs/skills/debug-issue.md`. Law: `AGENTS.md`.

1. Write or isolate a red test first (memory-port, then Express+Fastify HTTP). For INTERNAL/5xx JSON logs, start with error-log-review.
2. Fill a 3–5 row hypotheses table; falsify one row at a time before changing code.
3. Climb to SDK / e2e / git bisect only if the lower loop cannot see it. Keep the regression test.
Gotcha: do not log OTP/sk_/whsec_. Do not set RATE_LIMIT_MAX=0 in production.
Verify: the named Vitest is green, then the verify-change commands.
Full steps: `docs/skills/debug-issue.md`.
