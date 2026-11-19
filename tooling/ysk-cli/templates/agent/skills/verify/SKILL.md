---
name: verify
description: >
  Verify a YSK Kit change. Single package: pnpm --filter <pkg> test.
  Cross-package: layers, typecheck, test, OpenAPI, check agent, check
  errors, check docs-budget.
  Use when finishing a change or /verify.
  Do not use to skip commands and claim done, or to start Redis/Stripe
  in unit tests.
---

Read `docs/skills/verify-change.md`. Law: `AGENTS.md`. Read `docs/agent/NOW.md` first.

Keep the conversation to a one-line result. If this turn already went green and the worktree has not changed again, reuse that result.
