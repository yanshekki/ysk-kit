---
name: debug-issue
description: >
  Debug a YSK Kit failure by building a red feedback loop first: memory-port
  tests, then HTTP on Express AND Fastify, then SDK, then e2e, then git bisect.
  Use when a test, CI job, or user report is red; a flake; or /debug-issue.
  中文：除錯、紅燈迴圈、回歸測試、bisect、日誌遮罩。
  Do not use for green-field features (plan-feature) or a security audit (security-review).
---

Read `docs/skills/debug-issue.md`. Law: `AGENTS.md`.

1. Write or isolate a red test first (memory-port, then Express+Fastify HTTP).
2. Triage by error code. Fix the cause. Keep the regression test.
3. Climb to SDK / e2e / git bisect only if the lower loop cannot see it.
Gotcha: do not log OTP/sk_/whsec_. Do not set RATE_LIMIT_MAX=0 in production.
Verify: the named Vitest is green, then the five verify commands.
Full steps: `docs/skills/debug-issue.md`.
