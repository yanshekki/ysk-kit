---
name: verify-change
description: >
  Run the YSK Kit verification chain after every feature (layers, typecheck, test, OpenAPI, check agent, check errors).
  Use when finishing a change, after add module/capability, or /verify-change.
  中文：驗證、layers、typecheck、OpenAPI、check agent、check errors。
  Do not use to skip commands and claim done, or to start Redis/Stripe in unit tests.
---

Read `docs/skills/verify-change.md`. Law: `AGENTS.md`.

1. Run `pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent && pnpm ysk-kit check errors`.
2. `git diff --exit-code docs/openapi.yaml` (commit YAML if HTTP changed).
3. Conditional: lint, check:links, zh pair, lockstep changeset, e2e. JSONL: `check logs`. Behaviour change: at least one new/updated Vitest.
Gotcha: never claim done without fresh successful output of those commands in this turn.
Verify: emit the verification report in the skill output format.
Full steps: `docs/skills/verify-change.md`.
