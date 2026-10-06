---
name: fix-layers
description: >
  Repair a pnpm layers (dependency-cruiser) failure without disabling hexagonal rules.
  Use when pnpm layers fails, a client imported Prisma, or /fix-layers.
  中文：分層、dependency-cruiser、客戶端 Prisma。
  Do not use to edit .dependency-cruiser.cjs without explicit approval.
---

Read `docs/skills/fix-layers.md`. Law: `AGENTS.md`.

1. Read the cruiser rule name (`clients-no-server-infra`, `domain-no-infra`, …).
2. Move the import (SDK / port in infra / type in contracts). Do not disable the rule.
3. Re-run `pnpm layers`, then verify-change.
Gotcha: never edit `.dependency-cruiser.cjs` without explicit this-turn approval.
Verify: `pnpm layers`
Full steps: `docs/skills/fix-layers.md`.
