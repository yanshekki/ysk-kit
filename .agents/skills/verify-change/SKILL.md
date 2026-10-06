---
name: verify-change
description: >
  Run the YSK Kit verification chain after every feature (layers, typecheck, test, OpenAPI, check agent).
  Use when finishing a change, after add module/capability, or /verify-change.
  中文：驗證、layers、typecheck、OpenAPI、check agent。
  Do not use to skip commands and claim done, or to start Redis/Stripe in unit tests.
---

Read `docs/skills/verify-change.md`. Law: `AGENTS.md`.

1. Run `pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent`.
2. `git diff --exit-code docs/openapi.yaml` (commit YAML if HTTP changed).
3. Conditional: lint, check:links, zh pair, lockstep changeset, e2e.
Gotcha: never claim done without running the five commands in this turn.
Verify: emit the verification report in the skill output format.
Full steps: `docs/skills/verify-change.md`.
