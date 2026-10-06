---
name: review-change
description: >
  Review a YSK Kit diff on two axes: Law (AGENTS.md hard rules, definition of
  done, Do-not list) and Spec (the dated plan's scope and checklist). Flag
  high-risk items for a human.
  Use when asked to review a PR, a branch vs main, or uncommitted work; or /review-change.
  中文：審查、法律軸、計劃軸、高風險人工、合理化表。
  Do not use for implementing the change (plan-feature) or a dedicated
  security/Prisma deep dive (security-review, db-migration).
---

Read `docs/skills/review-change.md`. Law: `AGENTS.md`.

1. Diff is the report. Score Law (hard rules/DoD/Do-not) and Spec (dated plan).
2. Flag authz, webhooks, SQL DROP, secrets, LLM, breaking contracts for a human.
3. Run verify-change. Fill the rationalization table (no empty reasons).
Gotcha: do not self-approve high-risk; link security-review / db-migration.
Verify: `pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent`
Full steps: `docs/skills/review-change.md`.
