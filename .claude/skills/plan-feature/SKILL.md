---
name: plan-feature
description: >
  Write a YSK Kit feature plan to docs/plans/<yyyy-mm-dd>-<slug>.md before contracts and code.
  Use when the user wants a plan, plan.md, design, or a multi-surface change.
  中文：計劃、plan.md、合約之前。
  Do not use for typo-only or one-file mechanical renames.
---

Read `docs/skills/plan-feature.md`. Law: `AGENTS.md`.

1. Confirm a plan is required. Explore the tree (modules, contracts, SDK) first.
2. `pnpm ysk-kit plan <slug>` and fill every template heading.
3. `pnpm ysk-kit plan --check` both language files. Wait for approval.
Gotcha: do not implement first and backfill. If rejected as too short, expand.
Verify: `pnpm ysk-kit plan --check docs/plans/<date>-<slug>.md`
Full steps: `docs/skills/plan-feature.md`.
